"""
AI chat business logic — mirrors the separation of concerns of `ml.py`
(category prediction) and `nlp.py` (voice-command parsing): `views.py` stays
thin and delegates here.

v1 scope (see docs/refactor-plan.md-equivalent planning conversation):
non-streaming, session-only conversation (no DB persistence — the frontend
resends recent history each turn), single-shot context injection (no
tool-calling loop).
"""
import datetime

try:
    import zoneinfo
except ImportError:
    from backports import zoneinfo

import anthropic
from django.conf import settings
from django.db.models import Sum

from .analytics import get_exclusion_filter, predict_runway
from .models import Transaction

MODEL_NAME = "claude-haiku-4-5-20251001"
MAX_HISTORY_MESSAGES = 20
MAX_OUTPUT_TOKENS = 1024
RECENT_TRANSACTIONS_LIMIT = 30
TOP_CATEGORIES_LIMIT = 5

# Matches `predict_runway`'s timezone so "this month"/"today" boundaries in
# the chat's context agree with the Forecast the user sees on-screen.
USER_TZ = zoneinfo.ZoneInfo("America/Mexico_City")


class AnthropicServiceError(Exception):
    """Raised when the Anthropic API call fails for any reason (auth, rate limit, network)."""


SYSTEM_PROMPT_TEMPLATE = """Eres "Fin", el asistente financiero de FlowCash. Respondes ÚNICAMENTE en \
español, de forma breve, cálida y concreta (evita respuestas largas salvo que \
el usuario lo pida).

Tu única fuente de verdad es el contexto financiero que se te da abajo — son \
datos reales del usuario, no ejemplos. No inventes montos, categorías ni \
transacciones que no aparezcan ahí. Si la pregunta requiere datos fuera de \
las últimas {recent_limit} transacciones o de meses anteriores, dilo \
explícitamente y sugiere revisar "Cartera" o "Estadísticas" en la app.

Tu alcance es exclusivamente las finanzas personales del usuario dentro de \
FlowCash. Si preguntan algo fuera de eso (temas generales, consejo legal, \
fiscal o de inversión específico, o cualquier otro tema), indica amablemente \
que no es tu función y redirige la conversación a sus finanzas.

Usa siempre formato de moneda "$X,XXX.XX" y sé honesto sobre la incertidumbre \
del pronóstico cuando la confianza sea "low".

=== CONTEXTO FINANCIERO DEL USUARIO ===
{financial_context}
"""


def _format_currency(value):
    try:
        return f"${float(value):,.2f}"
    except (TypeError, ValueError):
        return "$0.00"


def _top_categories_this_month(user, now_local):
    start_of_month = now_local.replace(hour=0, minute=0, second=0, microsecond=0, day=1)
    start_utc = start_of_month.astimezone(datetime.timezone.utc)

    rows = (
        Transaction.objects.filter(user=user, type="expense", date__gte=start_utc)
        .exclude(get_exclusion_filter())
        .values("category")
        .annotate(total=Sum("amount"))
        .order_by("-total")[:TOP_CATEGORIES_LIMIT]
    )
    return [
        {"category": row["category"] or "Sin categoría", "total": float(row["total"] or 0)}
        for row in rows
    ]


def _fixed_expenses_lines(user):
    try:
        budget = user.budget
    except Exception:
        budget = None

    if not budget:
        return [], None

    lines = [
        f"- {fe.name}: {_format_currency(fe.amount)} ({fe.category})"
        for fe in budget.fixed_expenses.all()
    ]
    return lines, budget


def _recent_transactions_lines(user):
    rows = (
        Transaction.objects.filter(user=user)
        .order_by("-date")
        .values("date", "type", "amount", "category", "description")[:RECENT_TRANSACTIONS_LIMIT]
    )
    lines = []
    for row in rows:
        local_date = row["date"].astimezone(USER_TZ).strftime("%Y-%m-%d")
        category = row["category"] or "Sin categoría"
        lines.append(
            f"{local_date} | {row['type']} | {_format_currency(row['amount'])} | "
            f"{category} | {row['description']}"
        )
    return lines


def build_financial_context(user):
    """
    Assembles a compact, Spanish-language text block summarizing the user's
    financial state for injection into the chat system prompt. Reuses
    `predict_runway` (the same data the Forecast screen shows) instead of
    re-deriving spend stats from scratch, plus a small top-categories query
    and the last `RECENT_TRANSACTIONS_LIMIT` individual transactions so the
    model can reference specific line items without a tool-calling loop.
    """
    now_local = datetime.datetime.now(USER_TZ)
    forecast = predict_runway(user)

    fixed_lines, budget = _fixed_expenses_lines(user)
    top_categories = _top_categories_this_month(user, now_local)
    recent_lines = _recent_transactions_lines(user)

    sections = [
        f"=== RESUMEN FINANCIERO (al {now_local.strftime('%Y-%m-%d')}) ===",
        f"Ingreso disponible del mes: {_format_currency(forecast['disposable_budget'])}",
        f"Gastado este mes: {_format_currency(forecast['current_expenses'])}",
        f"Disponible restante: {_format_currency(forecast['current_remaining'])}",
        f"Ritmo de gasto diario: {_format_currency(forecast['daily_burn_rate'])}/día "
        f"(tendencia: {forecast['spending_trend']})",
        f"Presupuesto diario recomendado: {_format_currency(forecast['daily_allowance'])}/día",
        f"Confianza del pronóstico: {forecast['confidence']}",
        f"Estado: {forecast['status']}",
    ]
    if forecast.get("tip"):
        sections.append(forecast["tip"])

    if budget is not None:
        sections.append("")
        sections.append("=== GASTOS FIJOS ===")
        sections.extend(fixed_lines if fixed_lines else ["(sin gastos fijos configurados)"])
        sections.append(
            f"Total fijo: {_format_currency(forecast['fixed_expenses_total'])} | "
            f"Pagado: {_format_currency(forecast['fixed_expenses_paid'])} | "
            f"Pendiente: {_format_currency(forecast['unpaid_fixed'])}"
        )

    sections.append("")
    sections.append("=== TOP CATEGORÍAS ESTE MES ===")
    if top_categories:
        sections.extend(f"- {c['category']}: {_format_currency(c['total'])}" for c in top_categories)
    else:
        sections.append("(sin gastos categorizados este mes)")

    sections.append("")
    sections.append(f"=== ÚLTIMAS {RECENT_TRANSACTIONS_LIMIT} TRANSACCIONES ===")
    sections.extend(recent_lines if recent_lines else ["(sin transacciones registradas)"])

    return "\n".join(sections)


def _sanitize_history(history):
    """Drops anything that isn't a well-formed user/assistant turn — never trust client-supplied roles/length."""
    cleaned = []
    for turn in history[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(turn, dict):
            continue
        role = turn.get("role")
        content = turn.get("content")
        if role not in ("user", "assistant") or not isinstance(content, str) or not content.strip():
            continue
        cleaned.append({"role": role, "content": content})
    return cleaned


def get_chat_reply(user, message, history):
    """
    Sends one turn to Claude with the user's financial context as the system
    prompt and the sanitized/capped history + new message as the message
    list. Non-streaming — returns the full reply text.
    """
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise AnthropicServiceError("ANTHROPIC_API_KEY is not configured")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        recent_limit=RECENT_TRANSACTIONS_LIMIT,
        financial_context=build_financial_context(user),
    )

    messages = _sanitize_history(history)
    messages.append({"role": "user", "content": message})

    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=MAX_OUTPUT_TOKENS,
            system=system_prompt,
            messages=messages,
        )
    except anthropic.AnthropicError as exc:
        raise AnthropicServiceError(str(exc)) from exc

    text_parts = [block.text for block in response.content if getattr(block, "type", None) == "text"]
    return "".join(text_parts).strip()
