"""
Binance relay — a small, standalone service with exactly one job: forward an
already-signed HTTPS GET request to Binance from a region Binance doesn't
block (deployed on Fly.io's `qro`/Querétaro region), because Vercel's
serverless functions run on AWS US infrastructure and Binance rejects those
requests with a 451 ("restricted location").

This is deliberately NOT Binance-aware:
- It never receives the api_secret — the caller (Django, in
  `backend/wallet/binance_client.py`) already computed the HMAC signature
  and built the full signed URL before calling this relay. This service
  only ever sees a URL, an API key (not secret), and forwards them.
- It only forwards to `api.binance.com`, checked against an explicit
  allowlist — even a bug in the caller can never turn this into an
  open proxy.
- Auth between the two services is a shared secret, compared in constant
  time to avoid timing attacks, read from the `RELAY_SHARED_SECRET` env var
  (set via `fly secrets set`, never committed).
"""
import hmac
import os
from urllib.parse import urlparse

import requests
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI()

ALLOWED_HOSTS = {"api.binance.com"}
REQUEST_TIMEOUT = 10


class ForwardRequest(BaseModel):
    url: str
    headers: dict = {}


def _expected_secret() -> str:
    secret = os.environ.get("RELAY_SHARED_SECRET")
    if not secret:
        # Fails closed: an unconfigured relay refuses every request instead
        # of silently accepting an unauthenticated one.
        raise HTTPException(status_code=500, detail="relay_not_configured")
    return secret


@app.post("/forward")
def forward(payload: ForwardRequest, x_relay_auth: str = Header(default="")):
    expected = _expected_secret()
    if not hmac.compare_digest(x_relay_auth or "", expected):
        raise HTTPException(status_code=403, detail="unauthorized")

    parsed = urlparse(payload.url)
    if parsed.scheme != "https" or parsed.hostname not in ALLOWED_HOSTS:
        raise HTTPException(status_code=403, detail="host_not_allowed")

    try:
        response = requests.get(payload.url, headers=payload.headers, timeout=REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"binance_unreachable_from_relay: {exc}")

    try:
        body = response.json()
    except ValueError:
        body = response.text

    return {"status_code": response.status_code, "body": body}


@app.get("/health")
def health():
    return {"ok": True}
