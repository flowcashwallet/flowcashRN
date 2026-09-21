"""
Tests for the Binance read-only portfolio connection. Everything that would
otherwise hit Binance's real API is mocked — these tests never make a real
network call, on principle (a leaked test credential would be catastrophic
and there's no reason to depend on Binance's uptime to run the suite).
"""
import json
from unittest.mock import MagicMock, patch

from django.contrib.auth.models import User
from django.core.cache import cache
from django.test import TestCase, override_settings
from django.utils import timezone
from rest_framework.test import APIClient

from .binance_client import (
    BinanceCredentialsError,
    BinanceServiceError,
    check_read_only_permissions,
    fetch_spot_balances,
)
from .models import BinanceConnection
from .secrets_crypto import SecretEncryptionError, decrypt_secret, encrypt_secret

TEST_KEY = "uQ2W-BZR5QZ8iguiwaWJcaGlWWIsevbjQi_qMEzgmss="


def _mock_response(status_code=200, json_data=None, text=None):
    """`binance_client._execute_direct` now reads `.text` (not `.json()`) —
    mirrors what `requests` actually gives you, so this builds `.text` from
    `json_data` when a raw `text` override isn't given (e.g. a malformed body)."""
    response = MagicMock()
    response.status_code = status_code
    response.ok = 200 <= status_code < 400
    response.text = text if text is not None else json.dumps(json_data if json_data is not None else {})
    response.json.return_value = json_data if json_data is not None else {}
    return response


@override_settings(BINANCE_ENCRYPTION_KEY=TEST_KEY)
class SecretsCryptoTests(TestCase):
    def test_round_trip(self):
        token = encrypt_secret("my-secret-value")
        self.assertEqual(decrypt_secret(token), "my-secret-value")

    def test_encrypted_value_is_not_the_plaintext(self):
        token = encrypt_secret("my-secret-value")
        self.assertNotIn("my-secret-value", token)

    def test_decrypting_garbage_raises(self):
        with self.assertRaises(SecretEncryptionError):
            decrypt_secret("not-a-valid-fernet-token")

    @override_settings(BINANCE_ENCRYPTION_KEY=None)
    def test_missing_key_fails_closed(self):
        with self.assertRaises(SecretEncryptionError):
            encrypt_secret("anything")


@override_settings(BINANCE_ENCRYPTION_KEY=TEST_KEY)
class BinanceClientTests(TestCase):
    @patch("wallet.binance_client.requests.get")
    def test_accepts_a_key_with_only_reading_enabled(self, mock_get):
        mock_get.return_value = _mock_response(
            json_data={"ipRestrict": False, "enableReading": True, "enableWithdrawals": False}
        )
        result = check_read_only_permissions("key", "secret")
        self.assertTrue(result["enableReading"])

    @patch("wallet.binance_client.requests.get")
    def test_rejects_a_key_with_withdrawals_enabled(self, mock_get):
        mock_get.return_value = _mock_response(
            json_data={"enableReading": True, "enableWithdrawals": True}
        )
        with self.assertRaises(BinanceCredentialsError):
            check_read_only_permissions("key", "secret")

    @patch("wallet.binance_client.requests.get")
    def test_rejects_a_key_with_trading_enabled(self, mock_get):
        mock_get.return_value = _mock_response(
            json_data={"enableReading": True, "enableSpotAndMarginTrading": True}
        )
        with self.assertRaises(BinanceCredentialsError):
            check_read_only_permissions("key", "secret")

    @patch("wallet.binance_client.requests.get")
    def test_rejects_an_unknown_future_permission_by_default(self, mock_get):
        # Allowlist, not a denylist: any `enable*` other than `enableReading`
        # is treated as dangerous, even one this test doesn't know by name.
        mock_get.return_value = _mock_response(
            json_data={"enableReading": True, "enableSomeNewBinanceFeature": True}
        )
        with self.assertRaises(BinanceCredentialsError):
            check_read_only_permissions("key", "secret")

    @patch("wallet.binance_client.requests.get")
    def test_rejects_when_reading_itself_is_disabled(self, mock_get):
        mock_get.return_value = _mock_response(json_data={"enableReading": False})
        with self.assertRaises(BinanceCredentialsError):
            check_read_only_permissions("key", "secret")

    @patch("wallet.binance_client.requests.get")
    def test_fetch_spot_balances_drops_zero_balances(self, mock_get):
        mock_get.return_value = _mock_response(
            json_data={
                "balances": [
                    {"asset": "BTC", "free": "0.5", "locked": "0"},
                    {"asset": "ETH", "free": "0", "locked": "0"},
                    {"asset": "USDT", "free": "0", "locked": "100.25"},
                ]
            }
        )
        balances = fetch_spot_balances("key", "secret")
        self.assertEqual(
            balances,
            [
                {"asset": "BTC", "free": 0.5, "locked": 0.0},
                {"asset": "USDT", "free": 0.0, "locked": 100.25},
            ],
        )

    @patch("wallet.binance_client.requests.get")
    def test_invalid_signature_maps_to_credentials_error(self, mock_get):
        mock_get.return_value = _mock_response(status_code=401, text='{"code":-2015,"msg":"bad key"}')
        with self.assertRaises(BinanceCredentialsError):
            check_read_only_permissions("key", "secret")

    @patch("wallet.binance_client.requests.get")
    def test_network_failure_maps_to_service_error(self, mock_get):
        import requests

        mock_get.side_effect = requests.ConnectionError("boom")
        with self.assertRaises(BinanceServiceError):
            check_read_only_permissions("key", "secret")

    @patch("wallet.binance_client.requests.get")
    def test_server_error_maps_to_service_error(self, mock_get):
        mock_get.return_value = _mock_response(status_code=500, text="internal error")
        with self.assertRaises(BinanceServiceError):
            check_read_only_permissions("key", "secret")


@override_settings(
    BINANCE_ENCRYPTION_KEY=TEST_KEY,
    BINANCE_RELAY_URL="https://flowcash-binance-relay.fly.dev",
    BINANCE_RELAY_SHARED_SECRET="relay-secret",
)
class BinanceRelayTests(TestCase):
    """When `BINANCE_RELAY_URL` is set, requests go through `binance-relay/`
    instead of straight to Binance — see that service's own README for why
    (Binance 451s Vercel's AWS IPs). The relay never receives `api_secret`."""

    @patch("wallet.binance_client.requests.post")
    def test_forwards_through_the_relay_with_the_shared_secret(self, mock_post):
        mock_post.return_value = _mock_response(json_data={"status_code": 200, "body": {"enableReading": True}})

        result = check_read_only_permissions("mykey", "mysecret")

        self.assertTrue(result["enableReading"])
        call = mock_post.call_args
        self.assertEqual(call.args[0], "https://flowcash-binance-relay.fly.dev/forward")
        self.assertEqual(call.kwargs["headers"]["X-Relay-Auth"], "relay-secret")
        # The relay gets the already-signed URL and the (non-secret) api_key
        # header — never the raw api_secret in the request body/headers.
        self.assertIn("mykey", call.kwargs["json"]["headers"]["X-MBX-APIKEY"])
        self.assertNotIn("mysecret", str(call.kwargs))

    @patch("wallet.binance_client.requests.post")
    def test_binance_credentials_error_passes_through_the_relay(self, mock_post):
        mock_post.return_value = _mock_response(
            json_data={"status_code": 400, "body": '{"code":-2015,"msg":"bad key"}'}
        )
        with self.assertRaises(BinanceCredentialsError):
            check_read_only_permissions("mykey", "mysecret")

    @patch("wallet.binance_client.requests.post")
    def test_relay_auth_failure_is_a_service_error_not_a_credentials_error(self, mock_post):
        # A 403 from the relay itself (wrong shared secret, misconfiguration)
        # is OUR infra's fault — must never look like the user's key is bad.
        mock_post.return_value = _mock_response(status_code=403, text="unauthorized")
        with self.assertRaises(BinanceServiceError):
            check_read_only_permissions("mykey", "mysecret")

    @patch("wallet.binance_client.requests.post")
    def test_relay_unreachable_is_a_service_error(self, mock_post):
        import requests

        mock_post.side_effect = requests.ConnectionError("boom")
        with self.assertRaises(BinanceServiceError):
            check_read_only_permissions("mykey", "mysecret")


@override_settings(BINANCE_ENCRYPTION_KEY=TEST_KEY)
class BinanceEndpointTests(TestCase):
    def setUp(self):
        # `ScopedRateThrottle` uses Django's default cache, which is
        # process-wide and persists across test methods — clear it so one
        # test's requests never eat into another's rate-limit budget.
        cache.clear()
        self.user = User.objects.create_user(username="binanceuser", password="password")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_status_requires_authentication(self):
        anon_client = APIClient()
        response = anon_client.get("/api/wallet/binance/status/")
        self.assertEqual(response.status_code, 401)

    def test_status_when_not_connected(self):
        response = self.client.get("/api/wallet/binance/status/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {"connected": False, "masked_api_key": None, "last_synced_at": None})

    def test_connect_requires_both_fields(self):
        response = self.client.post("/api/wallet/binance/connect/", {"api_key": "onlykey"}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "api_key_and_secret_required")

    @patch("wallet.views.check_read_only_permissions")
    def test_connect_rejects_a_key_with_too_many_permissions(self, mock_check):
        mock_check.side_effect = BinanceCredentialsError("key_not_read_only:enableWithdrawals")

        response = self.client.post(
            "/api/wallet/binance/connect/",
            {"api_key": "abcd1234efgh5678", "api_secret": "supersecretvalue"},
            format="json",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("key_not_read_only", response.data["error"])
        # The over-privileged key must never be persisted, not even encrypted.
        self.assertFalse(BinanceConnection.objects.filter(user=self.user).exists())

    @patch("wallet.views.check_read_only_permissions")
    def test_connect_succeeds_and_never_echoes_the_raw_credentials(self, mock_check):
        mock_check.return_value = {"enableReading": True}

        response = self.client.post(
            "/api/wallet/binance/connect/",
            {"api_key": "abcd1234efgh5678", "api_secret": "supersecretvalue"},
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["connected"])
        self.assertNotIn("supersecretvalue", str(response.data))
        self.assertNotIn("abcd1234efgh5678", str(response.data))
        self.assertEqual(response.data["masked_api_key"], "abcd…5678")

        connection = BinanceConnection.objects.get(user=self.user)
        self.assertTrue(connection.is_read_only_confirmed)
        self.assertNotEqual(connection.api_key_encrypted, "abcd1234efgh5678")
        self.assertNotEqual(connection.api_secret_encrypted, "supersecretvalue")
        self.assertEqual(decrypt_secret(connection.api_key_encrypted), "abcd1234efgh5678")
        self.assertEqual(decrypt_secret(connection.api_secret_encrypted), "supersecretvalue")

    @patch("wallet.views.check_read_only_permissions")
    def test_connect_returns_502_when_binance_is_unreachable(self, mock_check):
        mock_check.side_effect = BinanceServiceError("timeout")

        response = self.client.post(
            "/api/wallet/binance/connect/",
            {"api_key": "abcd1234efgh5678", "api_secret": "supersecretvalue"},
            format="json",
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data["error"], "binance_service_unavailable")

    @override_settings(BINANCE_ENCRYPTION_KEY=None)
    @patch("wallet.views.check_read_only_permissions")
    def test_connect_returns_500_when_encryption_key_is_missing(self, mock_check):
        # A deploy config problem (BINANCE_ENCRYPTION_KEY unset), not the
        # user's key — the key already passed the permissions check.
        mock_check.return_value = {"enableReading": True}

        response = self.client.post(
            "/api/wallet/binance/connect/",
            {"api_key": "abcd1234efgh5678", "api_secret": "supersecretvalue"},
            format="json",
        )

        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["error"], "encryption_not_configured")
        self.assertFalse(BinanceConnection.objects.filter(user=self.user).exists())

    def test_disconnect_removes_the_connection(self):
        BinanceConnection.objects.create(
            user=self.user,
            api_key_encrypted=encrypt_secret("k"),
            api_secret_encrypted=encrypt_secret("s"),
            masked_key_preview="abcd…5678",
        )

        response = self.client.delete("/api/wallet/binance/connect/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(BinanceConnection.objects.filter(user=self.user).exists())

    def test_sync_without_a_connection_is_rejected(self):
        response = self.client.post("/api/wallet/binance/sync/")
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "not_connected")

    @patch("wallet.views.fetch_spot_balances")
    @patch("wallet.views.check_read_only_permissions")
    def test_sync_returns_balances_and_updates_last_synced_at(self, mock_check, mock_fetch):
        mock_check.return_value = {"enableReading": True}
        mock_fetch.return_value = [{"asset": "BTC", "free": 0.5, "locked": 0.0}]
        connection = BinanceConnection.objects.create(
            user=self.user,
            api_key_encrypted=encrypt_secret("k"),
            api_secret_encrypted=encrypt_secret("s"),
            masked_key_preview="abcd…5678",
        )

        response = self.client.post("/api/wallet/binance/sync/")

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["balances"], [{"asset": "BTC", "free": 0.5, "locked": 0.0}])
        connection.refresh_from_db()
        self.assertIsNotNone(connection.last_synced_at)

    @patch("wallet.views.check_read_only_permissions")
    def test_sync_disconnects_if_permissions_were_escalated_after_connecting(self, mock_check):
        # The key passed the check at connect time, but now has trading
        # enabled — sync must catch this and drop the connection, not just
        # trust the state it had when it was first connected.
        mock_check.side_effect = BinanceCredentialsError("key_not_read_only:enableSpotAndMarginTrading")
        BinanceConnection.objects.create(
            user=self.user,
            api_key_encrypted=encrypt_secret("k"),
            api_secret_encrypted=encrypt_secret("s"),
            masked_key_preview="abcd…5678",
            is_read_only_confirmed=True,
        )

        response = self.client.post("/api/wallet/binance/sync/")

        self.assertEqual(response.status_code, 400)
        self.assertTrue(response.data["disconnected"])
        self.assertFalse(BinanceConnection.objects.filter(user=self.user).exists())

    def test_sync_drops_a_connection_it_cannot_decrypt(self):
        BinanceConnection.objects.create(
            user=self.user,
            api_key_encrypted="not-a-valid-fernet-token",
            api_secret_encrypted="not-a-valid-fernet-token",
            masked_key_preview="abcd…5678",
        )

        response = self.client.post("/api/wallet/binance/sync/")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "stored_credentials_unreadable")
        self.assertFalse(BinanceConnection.objects.filter(user=self.user).exists())
