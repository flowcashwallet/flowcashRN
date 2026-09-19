"""
Small, generic helper to encrypt/decrypt a secret string at rest — currently
only used for the Binance API key/secret (`binance_client.py`, `models.py`'s
`BinanceConnection`), but deliberately not named `binance_*` so it's
reusable if another integration ever needs to store a per-user credential.

Uses Fernet (symmetric, authenticated encryption) with a key that lives only
in `settings.BINANCE_ENCRYPTION_KEY` (an env var — see `config/settings.py`),
never in the repo. No insecure default: any call fails closed if the key is
unset or malformed, same style as `ai_chat.py`'s `ANTHROPIC_API_KEY` guard.
"""
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


class SecretEncryptionError(Exception):
    """Raised when a secret can't be encrypted or decrypted — missing/bad
    key, or a stored value that doesn't decrypt with the current key."""


def _fernet() -> Fernet:
    key = settings.BINANCE_ENCRYPTION_KEY
    if not key:
        raise SecretEncryptionError("BINANCE_ENCRYPTION_KEY is not configured")
    try:
        return Fernet(key.encode() if isinstance(key, str) else key)
    except (ValueError, TypeError) as exc:
        raise SecretEncryptionError("BINANCE_ENCRYPTION_KEY is not a valid Fernet key") from exc


def encrypt_secret(raw: str) -> str:
    """Encrypts a plaintext string, returning a token safe to store in a TextField."""
    return _fernet().encrypt(raw.encode()).decode()


def decrypt_secret(token: str) -> str:
    """Decrypts a token produced by `encrypt_secret`. Raises `SecretEncryptionError`
    if the token is invalid or was encrypted with a different key (e.g. after a
    key rotation that didn't re-encrypt existing rows)."""
    try:
        return _fernet().decrypt(token.encode()).decode()
    except InvalidToken as exc:
        raise SecretEncryptionError("could not decrypt stored secret") from exc
