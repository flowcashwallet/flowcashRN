"""
Deliberately narrow client for Binance's REST API — exactly two calls exist
here, both read-only:

- `check_read_only_permissions` — verifies a key has no trading/withdrawal
  permissions before we ever store or use it.
- `fetch_spot_balances` — reads SPOT wallet balances.

This is intentionally NOT a general-purpose Binance SDK wrapper. Adding a
new call here should mean adding a new named, reviewed function — never a
generic "call any endpoint" method — so nothing in this codebase can
accidentally reach a trading/withdrawal endpoint through this module.

**Routing via the relay.** Vercel's serverless functions run on AWS US
infrastructure, and Binance rejects those requests with a 451 ("restricted
location") — a block on the calling IP, not on the user's credentials. When
`settings.BINANCE_RELAY_URL` is set, the already-signed request is forwarded
through a small standalone service deployed outside Vercel, in a region
Binance doesn't block (see `binance-relay/`) — that service never receives
`api_secret`, only the fully-signed URL. With `BINANCE_RELAY_URL` unset,
this calls Binance directly, unchanged from before the relay existed.

(Python 3.9 in production — `from __future__ import annotations` lets the
`dict | None`/`list[dict]` hints below work without a runtime error.)
"""
from __future__ import annotations

import hashlib
import hmac
import json
import time
from urllib.parse import urlencode

import requests
from django.conf import settings

_REQUEST_TIMEOUT = 10
_RECV_WINDOW = 5000


class BinanceCredentialsError(ValueError):
    """The supplied api_key/api_secret are invalid, or the key has more than
    read-only permissions. Maps to a 400 in views.py — a problem with the
    user's input, not our service."""


class BinanceServiceError(Exception):
    """Binance didn't respond, timed out, or returned something we can't
    parse. Maps to a 502 in views.py — mirrors ai_chat.py's AnthropicServiceError."""


def _base_url() -> str:
    return settings.BINANCE_API_BASE_URL


def _sign(secret: str, query: str) -> str:
    return hmac.new(secret.encode(), query.encode(), hashlib.sha256).hexdigest()


def _build_signed_url(path: str, api_secret: str, params: dict | None = None) -> str:
    query_params = dict(params or {})
    query_params["timestamp"] = int(time.time() * 1000)
    query_params.setdefault("recvWindow", _RECV_WINDOW)
    query = urlencode(query_params)
    signature = _sign(api_secret, query)
    return f"{_base_url()}{path}?{query}&signature={signature}"


def _execute_direct(url: str, headers: dict) -> tuple[int, str]:
    """Calls Binance directly — the original path, still used whenever
    `BINANCE_RELAY_URL` isn't set (e.g. local dev, or if the block is ever lifted)."""
    try:
        response = requests.get(url, headers=headers, timeout=_REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        raise BinanceServiceError(f"binance_request_failed: {exc}") from exc
    return response.status_code, response.text


def _execute_via_relay(url: str, headers: dict, relay_url: str) -> tuple[int, str]:
    """Forwards the already-built URL through `binance-relay/` — which never
    receives `api_secret`, only this URL and whatever (non-secret) headers
    the caller supplies (an API key header for signed calls, none for public ones)."""
    shared_secret = settings.BINANCE_RELAY_SHARED_SECRET
    if not shared_secret:
        raise BinanceServiceError("BINANCE_RELAY_SHARED_SECRET is not configured")

    try:
        relay_response = requests.post(
            f"{relay_url}/forward",
            json={"url": url, "headers": headers},
            headers={"X-Relay-Auth": shared_secret},
            timeout=_REQUEST_TIMEOUT + 5,
        )
    except requests.RequestException as exc:
        raise BinanceServiceError(f"relay_request_failed: {exc}") from exc

    if not relay_response.ok:
        # A non-2xx from the relay itself (bad shared secret, host not
        # allowlisted, relay unreachable to Binance) is OUR infra's fault,
        # never the user's key — always a service error, never credentials.
        raise BinanceServiceError(f"relay_returned_{relay_response.status_code}: {relay_response.text[:200]}")

    try:
        payload = relay_response.json()
    except ValueError as exc:
        raise BinanceServiceError("relay_response_not_json") from exc

    body = payload.get("body")
    return payload["status_code"], body if isinstance(body, str) else json.dumps(body)


def _execute(url: str, headers: dict) -> tuple[int, str, str]:
    """Runs the actual HTTP call, directly or via the relay. Returns
    `(status_code, body_text, source)` — `source` ("direct"/"relay") is
    tagged into every error message downstream so a log line can never be
    ambiguous about which path was taken (a relay call that reaches Binance
    but still gets rejected looks identical to a direct call otherwise)."""
    relay_url = settings.BINANCE_RELAY_URL
    via_relay = bool(relay_url)
    status_code, text = (
        _execute_via_relay(url, headers, relay_url) if via_relay else _execute_direct(url, headers)
    )
    return status_code, text, ("relay" if via_relay else "direct")


def _signed_get(path: str, api_key: str, api_secret: str, params: dict | None = None) -> dict:
    """Sends one signed GET to Binance, directly or via the relay. Private on
    purpose — everything else in this module goes through the allowlisted
    functions below."""
    url = _build_signed_url(path, api_secret, params)
    status_code, text, source = _execute(url, {"X-MBX-APIKEY": api_key})

    if status_code in (400, 401):
        # Binance returns 400/401 with {"code": -2015, "msg": "..."} for a bad
        # key/secret/signature, a clock-skew timestamp, or an IP restriction —
        # this is a credentials problem (400 to our own client), not an outage.
        raise BinanceCredentialsError(f"invalid_binance_credentials [{source}]: {text[:200]}")
    if status_code < 200 or status_code >= 300:
        raise BinanceServiceError(f"binance_returned_{status_code} [{source}]: {text[:200]}")

    try:
        return json.loads(text)
    except (ValueError, TypeError) as exc:
        raise BinanceServiceError(f"binance_response_not_json [{source}]") from exc


def _public_get(path: str, params: dict | None = None) -> dict:
    """Sends one GET to a PUBLIC Binance endpoint — no signature, no API key,
    no user credentials involved at all. Still routed through the relay when
    configured: Binance's IP block applies to the connection itself, before
    it even looks at whether the request is signed."""
    query = urlencode(params or {})
    url = f"{_base_url()}{path}" + (f"?{query}" if query else "")
    status_code, text, source = _execute(url, {})

    if status_code < 200 or status_code >= 300:
        raise BinanceServiceError(f"binance_returned_{status_code} [{source}]: {text[:200]}")
    try:
        return json.loads(text)
    except (ValueError, TypeError) as exc:
        raise BinanceServiceError(f"binance_response_not_json [{source}]") from exc


def check_read_only_permissions(api_key: str, api_secret: str) -> dict:
    """
    GET /sapi/v1/account/apiRestrictions — raises BinanceCredentialsError if
    ANY permission other than `enableReading` is True, or if reading itself
    is disabled.

    This is an allowlist, not a denylist: it rejects every `enable*` field
    that isn't `enableReading`, so a permission Binance adds in the future
    is rejected by default instead of silently passing through unnoticed.
    """
    data = _signed_get("/sapi/v1/account/apiRestrictions", api_key, api_secret)
    dangerous = [
        key for key, value in data.items()
        if key.startswith("enable") and key != "enableReading" and value
    ]
    if dangerous or not data.get("enableReading"):
        reason = ",".join(dangerous) if dangerous else "reading_disabled"
        raise BinanceCredentialsError(f"key_not_read_only:{reason}")
    return data


_KNOWN_LD_ASSETS = {
    "LDBTC", "LDETH", "LDUSDT", "LDUSDC", "LDBNB", "LDSOL", "LDXRP", "LDADA",
    "LDDOGE", "LDDOT", "LDMATIC", "LDLTC", "LDLINK", "LDAVAX", "LDTRX",
}


def _is_locked_earn_wrapper_token(asset: str) -> bool:
    """
    Binance's Simple Earn *Locked* positions come back with an `LD` prefix
    on the asset (`LDBTC` for a locked BTC position, confirmed against a
    real account — not documented consistently). The underlying asset is
    still plain BTC, redeemable 1:1.

    Checks an explicit allowlist first (safest); falls back to any "LD"
    prefix on a 3+ char remainder, since Binance doesn't otherwise use that
    prefix for real ticker symbols (a genuine "LDO" — Lido — is 3 chars,
    correctly excluded by the length check).
    """
    return asset in _KNOWN_LD_ASSETS or (asset.startswith("LD") and len(asset) > 4)


def _strip_locked_earn_prefix(asset: str) -> str:
    return asset[2:] if _is_locked_earn_wrapper_token(asset) else asset


def fetch_spot_balances(api_key: str, api_secret: str) -> list[dict]:
    """
    GET /api/v3/account — returns only the non-zero SPOT wallet balances,
    as `[{"asset": "BTC", "free": 0.5, "locked": 0.0}, ...]`. Funding/Margin/
    Futures wallets are still out of scope.

    Binance ALSO lists a Simple Earn subscription's wrapped receipt token
    (e.g. "LDBTC") as its own separate Spot balance, for the exact same
    quantity `fetch_earn_balances` already reports via the Simple Earn
    position endpoints — confirmed against a real account (both listed the
    same 0.5 BTC, doubling the portfolio total once naively merged). These
    are SKIPPED here entirely, not stripped-and-counted, so they're counted
    exactly once — via `fetch_earn_balances`, which has the correct home for
    a locked position, not here.
    """
    data = _signed_get("/api/v3/account", api_key, api_secret)
    balances = []
    for entry in data.get("balances", []):
        if _is_locked_earn_wrapper_token(entry.get("asset", "")):
            continue
        try:
            free = float(entry["free"])
            locked = float(entry["locked"])
        except (KeyError, TypeError, ValueError):
            continue
        if free + locked > 0:
            balances.append({"asset": entry["asset"], "free": free, "locked": locked})
    return balances


def fetch_earn_balances(api_key: str, api_secret: str) -> list[dict]:
    """
    Simple Earn positions — Flexible (`/sapi/v1/simple-earn/flexible/position`)
    and Locked (`/sapi/v1/simple-earn/locked/position`), both read-only under
    the same "Enable Reading" permission as everything else here. Returns
    `[{"asset": "BTC", "amount": 0.01}, ...]`, one entry per position (an
    asset can appear more than once if held in both products — merged by
    the caller, not here, to keep this function a plain data source).

    This is the SOLE source for locked-earn quantities — `fetch_spot_balances`
    deliberately skips the same holding's wrapped "LDxxx" token instead of
    also counting it, or it would be double-counted.

    Field names below match Binance's documented Simple Earn response shape
    at the time this was written; if Binance ever renames a field, this
    silently returns fewer/zero rows rather than raising — acceptable for a
    portfolio *display* feature, but worth a quick manual check against a
    real account after any Binance API changes.
    """
    balances = []

    flexible = _signed_get("/sapi/v1/simple-earn/flexible/position", api_key, api_secret)
    for row in flexible.get("rows", []):
        try:
            amount = float(row.get("totalAmount", row.get("amount", 0)))
        except (TypeError, ValueError):
            continue
        if amount > 0:
            balances.append({"asset": _strip_locked_earn_prefix(row["asset"]), "amount": amount})

    locked = _signed_get("/sapi/v1/simple-earn/locked/position", api_key, api_secret)
    for row in locked.get("rows", []):
        try:
            amount = float(row.get("amount", 0))
        except (TypeError, ValueError):
            continue
        if amount > 0:
            balances.append({"asset": _strip_locked_earn_prefix(row["asset"]), "amount": amount})

    return balances


# Stablecoins pegged ~1:1 to the dollar — Binance has no "USDTUSDT" pair, so
# these are priced as 1.0 without a ticker call instead of erroring.
_USD_STABLECOINS = {"USDT", "USDC", "BUSD", "FDUSD", "TUSD", "DAI", "USDP"}


def fetch_usdt_prices(assets: list[str]) -> dict[str, float | None]:
    """
    Prices each asset in USDT (~1:1 with USD) via Binance's public ticker —
    `GET /api/v3/ticker/price`, no signature or API key needed. This covers
    virtually every asset actually held on Binance (anything with a
    `{ASSET}USDT` trading pair), unlike a hand-picked CoinGecko symbol list.
    An asset with no such pair (delisted, or only trades against another
    quote currency) maps to `None` — still shown with its quantity, just
    without a dollar value, instead of failing the whole portfolio.
    """
    prices: dict[str, float | None] = {}
    for asset in assets:
        if asset in _USD_STABLECOINS:
            prices[asset] = 1.0
            continue
        try:
            data = _public_get("/api/v3/ticker/price", {"symbol": f"{asset}USDT"})
            prices[asset] = float(data["price"])
        except (BinanceServiceError, KeyError, TypeError, ValueError):
            prices[asset] = None
    return prices
