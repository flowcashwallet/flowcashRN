"""
AI chat business logic — mirrors the separation of concerns of `ml.py`
(category prediction) and `nlp.py` (voice-command parsing): `views.py` stays
thin and delegates here.

v1 scope (see docs/refactor-plan.md-equivalent planning conversation):
non-streaming, session-only conversation (no DB persistence — the frontend
resends recent history each turn). One tool (`propose_transaction`) is
offered so the assistant can propose a transaction from the conversation —
the frontend renders it as an inline confirmation card and only the app
(never the model) actually creates it via the existing `addTransaction`
thunk, on explicit user confirmation. There is still no full tool-execution
loop (no `tool_result` round-trip): the proposal is one-shot per turn, and a
plain-text summary of it is always folded into the reply so later turns keep
enough context to handle follow-ups ("cambia el monto a 300").
"""
import datetime
import math

try:
    import zoneinfo
except ImportError:
    from backports import zoneinfo

import anthropic
from django.conf import settings
from django.db.models import Sum

from .analytics import get_exclusion_filter, predict_runway
from .models import Category, Transaction

MODEL_NAME = "claude-haiku-4-5-20251001"
MAX_HISTORY_MESSAGES = 20
MAX_OUTPUT_TOKENS = 1024
RECENT_TRANSACTIONS_LIMIT = 30
TOP_CATEGORIES_LIMIT = 5

PROPOSE_TRANSACTION_TOOL = {
    "name": "propose_transaction",
    "description": (
        "Propone una transacción nueva para que el usuario la confirme en la "
        "app — no la crea de verdad, solo abre una tarjeta de confirmación. "
        "Úsala SOLO cuando ya tengas monto, tipo (income/expense) y una "
        "descripción breve; si falta alguno, sigue preguntando en vez de "
        "llamar la herramienta con datos incompletos o inventados."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "amount": {
                "type": "number",
                "description": "Monto positivo de la transacción, en la moneda del usuario.",
            },
            "type": {
                "type": "string",
                "enum": ["income", "expense"],
                "description": "\"income\" si es un ingreso, \"expense\" si es un gasto.",
            },
            "description": {
                "type": "string",
                "description": "Descripción corta y clara, ej. \"Supermercado\".",
            },
            "category": {
                "type": "string",
                "description": (
                    "Categoría, de preferencia una de las que ya usa el usuario "
                    "(ver el contexto financiero). Déjala vacía si no es evidente."
                ),
            },
        },
        "required": ["amount", "type", "description"],
    },
}

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

Si el usuario quiere registrar un gasto o ingreso nuevo, pregúntale lo que \
falte (monto, si es gasto o ingreso, una descripción breve, y categoría si no \
es obvia) antes de proponerlo — de preferencia usa una de sus categorías \
existentes (ver el contexto). Cuando ya tengas monto, tipo y descripción, usa \
la herramienta `propose_transaction`; no antes, y no la llames más de una vez \
por turno. La herramienta NO crea la transacción — solo abre una tarjeta que \
el usuario debe confirmar en la app. Nunca digas que ya se agregó o guardó: \
esa confirmación la da la propia app cuando el usuario la confirme.

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


def _user_category_names(user):
    return list(
        Category.objects.filter(user=user).order_by("name").values_list("name", flat=True)
    )


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
    category_names = _user_category_names(user)
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
    sections.append("=== CATEGORÍAS DEL USUARIO ===")
    sections.append(
        ", ".join(category_names) if category_names else "(sin categorías propias creadas)"
    )

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


def _validate_transaction_proposal(raw):
    """
    Never trust the model's tool call blindly — re-validate shape/types
    before it reaches the frontend, same spirit as `_sanitize_history` for
    client input.
    """
    if not isinstance(raw, dict):
        return None
    try:
        amount = float(raw.get("amount"))
    except (TypeError, ValueError):
        return None
    # `float()` happily parses "nan"/"inf" strings — guard explicitly so those
    # can't sneak past the `amount <= 0` check (NaN comparisons are always False).
    if not math.isfinite(amount) or amount <= 0:
        return None

    tx_type = raw.get("type")
    if tx_type not in ("income", "expense"):
        return None

    description = str(raw.get("description") or "").strip()
    if not description:
        return None

    category = str(raw.get("category") or "").strip() or None

    return {
        "amount": amount,
        "type": tx_type,
        "description": description,
        "category": category,
    }


def _describe_proposal(proposal):
    """
    A plain-text summary of the proposal, always folded into the reply (see
    `get_chat_reply`) so it survives into `history` on the next turn — the
    frontend only round-trips `{role, content}` text, not the raw tool_use
    block, so this is the only trace the model has of what it just proposed
    if the user asks to tweak it in a follow-up.
    """
    label = "un ingreso" if proposal["type"] == "income" else "un gasto"
    category_part = f" en {proposal['category']}" if proposal["category"] else ""
    return (
        f"Propuesta: {label} de {_format_currency(proposal['amount'])}{category_part} "
        f"— \"{proposal['description']}\". Confírmalo en la tarjeta de abajo."
    )


def get_chat_reply(user, message, history):
    """
    Sends one turn to Claude with the user's financial context as the system
    prompt and the sanitized/capped history + new message as the message
    list. Non-streaming. Returns `(reply_text, transaction_proposal)` —
    `transaction_proposal` is `None` unless the model called
    `propose_transaction` this turn.
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
            tools=[PROPOSE_TRANSACTION_TOOL],
            messages=messages,
        )
    except anthropic.AnthropicError as exc:
        raise AnthropicServiceError(str(exc)) from exc

    text_parts = []
    transaction_proposal = None
    for block in response.content:
        block_type = getattr(block, "type", None)
        if block_type == "text":
            text_parts.append(block.text)
        elif block_type == "tool_use" and block.name == "propose_transaction" and transaction_proposal is None:
            transaction_proposal = _validate_transaction_proposal(block.input)

    reply_text = "".join(text_parts).strip()
    if transaction_proposal:
        summary = _describe_proposal(transaction_proposal)
        reply_text = f"{reply_text}\n\n{summary}" if reply_text else summary

    return reply_text, transaction_proposal
