"""
AI chat business logic — mirrors the separation of concerns of `ml.py`
(category prediction) and `nlp.py` (voice-command parsing): `views.py` stays
thin and delegates here.

v1 scope (see docs/refactor-plan.md-equivalent planning conversation):
non-streaming, session-only conversation (no DB persistence — the frontend
resends recent history each turn). Three tools let the assistant propose
creating, editing or deleting a transaction from the conversation — the
frontend renders each as an inline confirmation card and only the app (never
the model) actually mutates anything, via the existing `addTransaction`/
`updateTransaction`/`deleteTransaction` thunks, on explicit user confirmation.
A turn may carry several proposals at once (a receipt photo or a statement
screenshot can hold many transactions), so the reply returns a *list*.

The turn also accepts images (receipts, purchase screenshots, statement
listings) as base64 blocks, which is how the model fills in concept and
category on its own. Images are only ever sent for the current turn —
`history` stays text-only, so the plain-text summary of each proposal that
gets folded into the reply is what keeps later turns coherent ("cambia el
monto a 300") without re-uploading anything.

There is still no full tool-execution loop (no `tool_result` round-trip).
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
from .models import Category, Transaction, VisionEntity

MODEL_NAME = "claude-haiku-4-5-20251001"
MAX_HISTORY_MESSAGES = 20
RECENT_TRANSACTIONS_LIMIT = 30
TOP_CATEGORIES_LIMIT = 5

# Una captura de un estado de cuenta puede traer varias transacciones, así
# que el turno puede devolver varias propuestas y necesita más espacio de
# salida que una respuesta conversacional suelta.
MAX_OUTPUT_TOKENS = 2048
MAX_PROPOSALS_PER_TURN = 10

# Límites de imagen. El tope real que manda es el del body de Vercel (~4.5MB),
# así que se acota por imagen y en total, antes de gastar una llamada a la API.
MAX_IMAGES_PER_TURN = 4
MAX_IMAGE_BASE64_CHARS = 1_800_000  # ~1.35 MB por imagen ya decodificada
MAX_TOTAL_IMAGE_BASE64_CHARS = 4_000_000  # ~3 MB decodificados en total
SUPPORTED_IMAGE_MEDIA_TYPES = ("image/jpeg", "image/png", "image/webp", "image/gif")


class ImagePayloadError(ValueError):
    """Raised when the client sends images that can't be forwarded to the model."""

# Matches `predict_runway`'s timezone so "this month"/"today" boundaries in
# the chat's context agree with the Forecast the user sees on-screen.
USER_TZ = zoneinfo.ZoneInfo("America/Mexico_City")


class AnthropicServiceError(Exception):
    """Raised when the Anthropic API call fails for any reason (auth, rate limit, network)."""


_ACCOUNT_NAME_PROPERTY = {
    "type": "string",
    "description": (
        "Nombre EXACTO de una de las cuentas del usuario (ver 'CUENTAS DEL "
        "USUARIO' en el contexto) — p. ej. una tarjeta o cuenta bancaria. "
        "Opcional; déjala vacía si el usuario no mencionó ninguna cuenta o "
        "no estás seguro a cuál se refiere."
    ),
}

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
            "account_name": _ACCOUNT_NAME_PROPERTY,
        },
        "required": ["amount", "type", "description"],
    },
}

PROPOSE_TRANSACTION_EDIT_TOOL = {
    "name": "propose_transaction_edit",
    "description": (
        "Propone editar una transacción EXISTENTE del usuario — no la "
        "modifica de verdad, solo abre una tarjeta de confirmación con lo "
        "que cambiaría. Usa el `transaction_id` EXACTO tal como aparece en "
        "'ÚLTIMAS TRANSACCIONES' del contexto (el número después de '#'); "
        "nunca inventes uno. Si hay varias transacciones parecidas y no está "
        "claro cuál es, pregunta antes de llamar la herramienta. Incluye "
        "solo los campos que cambian — deja el resto sin mandar."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "transaction_id": {
                "type": "string",
                "description": "ID exacto de la transacción, tal como aparece en el contexto (sin el '#').",
            },
            "amount": {"type": "number", "description": "Nuevo monto, solo si cambia."},
            "type": {
                "type": "string",
                "enum": ["income", "expense"],
                "description": "Nuevo tipo, solo si cambia.",
            },
            "description": {"type": "string", "description": "Nueva descripción, solo si cambia."},
            "category": {"type": "string", "description": "Nueva categoría, solo si cambia."},
            "account_name": _ACCOUNT_NAME_PROPERTY,
        },
        "required": ["transaction_id"],
    },
}

PROPOSE_TRANSACTION_DELETE_TOOL = {
    "name": "propose_transaction_delete",
    "description": (
        "Propone eliminar una transacción EXISTENTE del usuario — no la "
        "elimina de verdad, solo abre una tarjeta de confirmación. Usa el "
        "`transaction_id` EXACTO de 'ÚLTIMAS TRANSACCIONES' en el contexto "
        "(el número después de '#'); nunca inventes uno. Si hay varias "
        "transacciones parecidas, pregunta cuál antes de llamarla."
    ),
    "input_schema": {
        "type": "object",
        "properties": {
            "transaction_id": {
                "type": "string",
                "description": "ID exacto de la transacción a eliminar, tal como aparece en el contexto.",
            },
        },
        "required": ["transaction_id"],
    },
}

ALL_TRANSACTION_TOOLS = [
    PROPOSE_TRANSACTION_TOOL,
    PROPOSE_TRANSACTION_EDIT_TOOL,
    PROPOSE_TRANSACTION_DELETE_TOOL,
]


SYSTEM_PROMPT_TEMPLATE = """Eres "Fin", el asistente financiero de FlowCash. Respondes ÚNICAMENTE en \
español, de forma breve, cálida y concreta (evita respuestas largas salvo que \
el usuario lo pida).

Tu única fuente de verdad es el contexto financiero que se te da abajo — son \
datos reales del usuario, no ejemplos. No inventes montos, categorías, \
cuentas ni transacciones que no aparezcan ahí. Si la pregunta requiere datos \
fuera de las últimas {recent_limit} transacciones o de meses anteriores, \
dilo explícitamente y sugiere revisar "Cartera" o "Estadísticas" en la app.

Tu alcance es exclusivamente las finanzas personales del usuario dentro de \
FlowCash. Si preguntan algo fuera de eso (temas generales, consejo legal, \
fiscal o de inversión específico, o cualquier otro tema), indica amablemente \
que no es tu función y redirige la conversación a sus finanzas.

Usa siempre formato de moneda "$X,XXX.XX" y sé honesto sobre la incertidumbre \
del pronóstico cuando la confianza sea "low".

Si el usuario adjunta una o varias imágenes (un ticket, una captura de una \
compra, o un listado/estado de cuenta), léelas y extrae de ahí cada \
transacción: monto, concepto (descripción corta y clara) y categoría — usa \
siempre una de las categorías del usuario si alguna encaja. Llama \
`propose_transaction` UNA VEZ POR CADA transacción que veas en las imágenes \
(si el listado trae seis movimientos, propón las seis en el mismo turno), \
pero nunca inventes una que no se lea con claridad: si algo está ilegible o \
dudoso, dilo y pregunta en vez de adivinar. No inventes la cuenta: déjala \
vacía salvo que el usuario ya te haya dicho cuál usar. Después de proponer, \
dile en una línea breve que puede elegir la cuenta en cada tarjeta y pedirte \
cambios si alguna categoría o concepto no cuadra.

Puedes proponer crear, editar o eliminar transacciones — nunca las creas, \
modificas ni eliminas tú mismo, solo abres una tarjeta que el usuario debe \
confirmar en la app:
- Para registrar un gasto o ingreso nuevo: pregunta lo que falte (monto, si \
es gasto o ingreso, descripción breve, categoría si no es obvia, y a qué \
cuenta va si el usuario lo menciona) y usa `propose_transaction` solo cuando \
ya tengas monto, tipo y descripción.
- Para editar o eliminar una transacción existente: identifícala por su \
`transaction_id` exacto en 'ÚLTIMAS TRANSACCIONES' del contexto (nunca lo \
inventes) — si hay ambigüedad entre varias parecidas, pregunta cuál antes de \
llamar la herramienta. Usa `propose_transaction_edit` o \
`propose_transaction_delete` según corresponda.
Para cuentas, usa siempre el nombre EXACTO de 'CUENTAS DEL USUARIO'. Si el \
usuario te pide corregir algo de una tarjeta que todavía no confirma, vuelve \
a proponer SOLO esa transacción ya corregida y dile que cancele la tarjeta \
anterior. Nunca digas que algo ya se creó, editó o eliminó: esa confirmación \
la da la propia app cuando el usuario confirme la tarjeta.

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


def _user_accounts_lines(user):
    entities = VisionEntity.objects.filter(user=user).order_by("name")
    return [
        f"- {e.name} ({'activo' if e.type == 'asset' else 'pasivo'})" for e in entities
    ]


def _recent_transactions_lines(user):
    rows = (
        Transaction.objects.filter(user=user)
        .order_by("-date")
        .values("id", "date", "type", "amount", "category", "description")[:RECENT_TRANSACTIONS_LIMIT]
    )
    lines = []
    for row in rows:
        local_date = row["date"].astimezone(USER_TZ).strftime("%Y-%m-%d")
        category = row["category"] or "Sin categoría"
        lines.append(
            f"#{row['id']} | {local_date} | {row['type']} | {_format_currency(row['amount'])} | "
            f"{category} | {row['description']}"
        )
    return lines


def build_financial_context(user):
    """
    Assembles a compact, Spanish-language text block summarizing the user's
    financial state for injection into the chat system prompt. Reuses
    `predict_runway` (the same data the Forecast screen shows) instead of
    re-deriving spend stats from scratch, plus a small top-categories query
    and the last `RECENT_TRANSACTIONS_LIMIT` individual transactions (with
    their real ids, so `propose_transaction_edit`/`_delete` can reference one
    exactly) so the model can act on specific line items without a
    tool-calling loop.
    """
    now_local = datetime.datetime.now(USER_TZ)
    forecast = predict_runway(user)

    fixed_lines, budget = _fixed_expenses_lines(user)
    top_categories = _top_categories_this_month(user, now_local)
    category_names = _user_category_names(user)
    account_lines = _user_accounts_lines(user)
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
    sections.append("=== CUENTAS DEL USUARIO (activos y pasivos) ===")
    sections.extend(account_lines if account_lines else ["(sin cuentas registradas en Balance)"])

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


def _clean_amount(raw_amount):
    """Returns a finite, positive float, or `None` if `raw_amount` doesn't parse to one."""
    try:
        amount = float(raw_amount)
    except (TypeError, ValueError):
        return None
    # `float()` happily parses "nan"/"inf" strings — guard explicitly so those
    # can't sneak past a naive `amount <= 0` check (NaN compares False to everything).
    if not math.isfinite(amount) or amount <= 0:
        return None
    return amount


def _resolve_account(user, account_name):
    """
    Matches a model-supplied account name against the user's own
    `VisionEntity` rows (case-insensitive exact match first, then substring).
    Returns `(id, name)` of the match, or `(None, None)` if nothing matches —
    callers treat that as "no account", not an error, since the account is
    always optional (same as the manual entity picker in `TransactionModal`).
    """
    if not account_name:
        return None, None
    account_name = str(account_name).strip()
    if not account_name:
        return None, None

    match = VisionEntity.objects.filter(user=user, name__iexact=account_name).first()
    if not match:
        match = VisionEntity.objects.filter(user=user, name__icontains=account_name).first()
    if match:
        return str(match.id), match.name
    return None, None


def _validate_create_proposal(user, raw):
    """Never trust the model's tool call blindly — re-validate shape/types before it reaches the frontend."""
    if not isinstance(raw, dict):
        return None

    amount = _clean_amount(raw.get("amount"))
    if amount is None:
        return None

    tx_type = raw.get("type")
    if tx_type not in ("income", "expense"):
        return None

    description = str(raw.get("description") or "").strip()
    if not description:
        return None

    category = str(raw.get("category") or "").strip() or None
    account_id, account_name = _resolve_account(user, raw.get("account_name"))

    return {
        "kind": "create",
        "transaction_id": None,
        "amount": amount,
        "type": tx_type,
        "description": description,
        "category": category,
        "account_id": account_id,
        "account_name": account_name,
        "previous": None,
    }


def _get_owned_transaction(user, raw_transaction_id):
    """
    Looks up a transaction by id, scoped to `user` — this is the security
    boundary for edit/delete proposals: even if the model hallucinated an id
    belonging to someone else (or one that doesn't exist), this returns
    `None` and the proposal is dropped rather than reaching the frontend.
    """
    if raw_transaction_id in (None, ""):
        return None
    try:
        return Transaction.objects.get(user=user, id=raw_transaction_id)
    except (Transaction.DoesNotExist, ValueError, TypeError):
        return None


def _account_name_for_entity_id(entity_id):
    if not entity_id:
        return None
    return VisionEntity.objects.filter(id=entity_id).values_list("name", flat=True).first()


def _validate_edit_proposal(user, raw):
    if not isinstance(raw, dict):
        return None

    tx = _get_owned_transaction(user, raw.get("transaction_id"))
    if tx is None:
        return None

    previous = {
        "amount": float(tx.amount),
        "type": tx.type,
        "description": tx.description,
        "category": tx.category,
        "account_name": _account_name_for_entity_id(tx.related_entity_id),
    }

    amount = previous["amount"]
    if raw.get("amount") is not None:
        candidate = _clean_amount(raw["amount"])
        if candidate is not None:
            amount = candidate

    tx_type = previous["type"]
    if raw.get("type") in ("income", "expense"):
        tx_type = raw["type"]

    description = previous["description"]
    if raw.get("description"):
        candidate = str(raw["description"]).strip()
        if candidate:
            description = candidate

    category = previous["category"]
    if raw.get("category") is not None:
        category = str(raw["category"]).strip() or None

    account_id = str(tx.related_entity_id) if tx.related_entity_id else None
    account_name = previous["account_name"]
    if raw.get("account_name"):
        resolved_id, resolved_name = _resolve_account(user, raw["account_name"])
        if resolved_id:
            account_id, account_name = resolved_id, resolved_name

    return {
        "kind": "edit",
        "transaction_id": str(tx.id),
        "amount": amount,
        "type": tx_type,
        "description": description,
        "category": category,
        "account_id": account_id,
        "account_name": account_name,
        "previous": previous,
    }


def _validate_delete_proposal(user, raw):
    if not isinstance(raw, dict):
        return None

    tx = _get_owned_transaction(user, raw.get("transaction_id"))
    if tx is None:
        return None

    return {
        "kind": "delete",
        "transaction_id": str(tx.id),
        "amount": float(tx.amount),
        "type": tx.type,
        "description": tx.description,
        "category": tx.category,
        "account_id": str(tx.related_entity_id) if tx.related_entity_id else None,
        "account_name": _account_name_for_entity_id(tx.related_entity_id),
        "previous": None,
    }


def _describe_proposal(proposal):
    """
    A plain-text summary of the proposal, always folded into the reply (see
    `get_chat_reply`) so it survives into `history` on the next turn — the
    frontend only round-trips `{role, content}` text, not the raw tool_use
    block, so this is the only trace the model has of what it just proposed
    if the user asks to tweak it in a follow-up.
    """
    account_part = f" (cuenta: {proposal['account_name']})" if proposal.get("account_name") else ""

    if proposal["kind"] == "delete":
        return (
            f"Propuesta: eliminar la transacción #{proposal['transaction_id']} — "
            f"\"{proposal['description']}\" de {_format_currency(proposal['amount'])}."
        )

    label = "un ingreso" if proposal["type"] == "income" else "un gasto"

    if proposal["kind"] == "edit":
        return (
            f"Propuesta: editar la transacción #{proposal['transaction_id']} a "
            f"{label} de {_format_currency(proposal['amount'])}{account_part} — "
            f"\"{proposal['description']}\"."
        )

    category_part = f" en {proposal['category']}" if proposal.get("category") else ""
    return (
        f"Propuesta: {label} de {_format_currency(proposal['amount'])}{category_part}"
        f"{account_part} — \"{proposal['description']}\"."
    )


_PROPOSAL_VALIDATORS = {
    "propose_transaction": _validate_create_proposal,
    "propose_transaction_edit": _validate_edit_proposal,
    "propose_transaction_delete": _validate_delete_proposal,
}


def build_image_blocks(images):
    """
    Turns the client's `images` payload into Anthropic image content blocks.

    Raises `ImagePayloadError` (→ 400, never a wasted API call) when the
    client sends too many images, an unsupported media type, or more base64
    than the serverless request body can carry. The app compresses before
    uploading; this is the server-side backstop.
    """
    if not images:
        return []
    if not isinstance(images, list):
        raise ImagePayloadError("images_must_be_a_list")
    if len(images) > MAX_IMAGES_PER_TURN:
        raise ImagePayloadError("too_many_images")

    blocks = []
    total_chars = 0
    for image in images:
        if not isinstance(image, dict):
            raise ImagePayloadError("invalid_image")

        media_type = image.get("media_type")
        if media_type not in SUPPORTED_IMAGE_MEDIA_TYPES:
            raise ImagePayloadError("unsupported_image_type")

        data = image.get("data")
        if not isinstance(data, str) or not data.strip():
            raise ImagePayloadError("invalid_image")

        # El cliente puede mandar un data URL completo; el SDK solo quiere el base64.
        if data.startswith("data:"):
            _, _, data = data.partition(",")

        if len(data) > MAX_IMAGE_BASE64_CHARS:
            raise ImagePayloadError("image_too_large")

        total_chars += len(data)
        if total_chars > MAX_TOTAL_IMAGE_BASE64_CHARS:
            raise ImagePayloadError("images_too_large")

        blocks.append(
            {
                "type": "image",
                "source": {"type": "base64", "media_type": media_type, "data": data},
            }
        )

    return blocks


def get_chat_reply(user, message, history, images=None):
    """
    Sends one turn to Claude with the user's financial context as the system
    prompt, the sanitized/capped history, and the new message (with any
    attached images). Non-streaming.

    Returns `(reply_text, transaction_proposals)` — a list, empty unless the
    model called one or more of the three transaction tools this turn (a
    statement screenshot can legitimately produce several).
    """
    api_key = settings.ANTHROPIC_API_KEY
    if not api_key:
        raise AnthropicServiceError("ANTHROPIC_API_KEY is not configured")

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        recent_limit=RECENT_TRANSACTIONS_LIMIT,
        financial_context=build_financial_context(user),
    )

    messages = _sanitize_history(history)

    # Las imágenes van antes del texto: es el orden que Anthropic recomienda
    # cuando el texto se refiere a lo que hay en la imagen.
    image_blocks = build_image_blocks(images)
    if image_blocks:
        content = list(image_blocks)
        content.append({"type": "text", "text": message or "Extrae las transacciones de estas imágenes."})
        messages.append({"role": "user", "content": content})
    else:
        messages.append({"role": "user", "content": message})

    client = anthropic.Anthropic(api_key=api_key)
    try:
        response = client.messages.create(
            model=MODEL_NAME,
            max_tokens=MAX_OUTPUT_TOKENS,
            system=system_prompt,
            tools=ALL_TRANSACTION_TOOLS,
            messages=messages,
        )
    except anthropic.AnthropicError as exc:
        raise AnthropicServiceError(str(exc)) from exc

    text_parts = []
    proposals = []
    for block in response.content:
        block_type = getattr(block, "type", None)
        if block_type == "text":
            text_parts.append(block.text)
        elif block_type == "tool_use" and len(proposals) < MAX_PROPOSALS_PER_TURN:
            validator = _PROPOSAL_VALIDATORS.get(block.name)
            if validator is not None:
                proposal = validator(user, block.input)
                if proposal is not None:
                    proposals.append(proposal)

    reply_text = "".join(text_parts).strip()
    if proposals:
        lines = [_describe_proposal(p) for p in proposals]
        lines.append(
            "Confírmalas en las tarjetas de abajo."
            if len(proposals) > 1
            else "Confírmalo en la tarjeta de abajo."
        )
        summary = "\n".join(lines)
        reply_text = f"{reply_text}\n\n{summary}" if reply_text else summary

    return reply_text, proposals
