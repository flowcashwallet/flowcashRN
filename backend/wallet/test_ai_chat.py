from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .ai_chat import (
    MAX_IMAGE_BASE64_CHARS,
    MAX_IMAGES_PER_TURN,
    AnthropicServiceError,
    ImagePayloadError,
    _resolve_account,
    _sanitize_history,
    _validate_create_proposal,
    _validate_delete_proposal,
    _validate_edit_proposal,
    build_financial_context,
    build_image_blocks,
)
from .models import BinanceConnection, Budget, Category, FixedExpense, Transaction, VisionEntity


class BuildFinancialContextTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chatuser", password="password")
        self.budget = Budget.objects.create(
            user=self.user, monthly_income=Decimal("10000.00"), is_setup=True
        )
        FixedExpense.objects.create(
            budget=self.budget, name="Renta", amount=Decimal("3000.00"), category="Vivienda"
        )
        self.tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("250.50"),
            type="expense",
            description="Supermercado",
            category="Comida",
            date=timezone.now(),
        )
        Transaction.objects.create(
            user=self.user,
            amount=Decimal("8000.00"),
            type="income",
            description="Nómina",
            date=timezone.now(),
        )

    def test_includes_fixed_expenses_and_recent_transactions(self):
        context = build_financial_context(self.user)
        self.assertIn("Renta", context)
        self.assertIn("$3,000.00", context)
        self.assertIn("Supermercado", context)
        self.assertIn("Comida", context)
        self.assertIn("RESUMEN FINANCIERO", context)
        self.assertIn("TOP CATEGORÍAS ESTE MES", context)

    def test_recent_transactions_include_their_real_id(self):
        # `propose_transaction_edit`/`_delete` need the model to reference an
        # exact id from this list.
        context = build_financial_context(self.user)
        self.assertIn(f"#{self.tx.id} |", context)

    def test_includes_the_user_own_category_names(self):
        Category.objects.create(user=self.user, name="Comida")
        Category.objects.create(user=self.user, name="Transporte")
        context = build_financial_context(self.user)
        self.assertIn("CATEGORÍAS DEL USUARIO", context)
        self.assertIn("Comida, Transporte", context)

    def test_includes_the_user_own_accounts(self):
        VisionEntity.objects.create(user=self.user, name="BBVA", type="asset", amount=Decimal("1000.00"))
        VisionEntity.objects.create(user=self.user, name="Tarjeta Oro", type="liability", amount=Decimal("500.00"))
        context = build_financial_context(self.user)
        self.assertIn("CUENTAS DEL USUARIO", context)
        self.assertIn("BBVA (activo)", context)
        self.assertIn("Tarjeta Oro (pasivo)", context)

    def test_handles_user_without_budget_or_transactions(self):
        other_user = User.objects.create_user(username="nobudget", password="password")
        context = build_financial_context(other_user)
        self.assertNotIn("GASTOS FIJOS", context)
        self.assertIn("(sin transacciones registradas)", context)
        self.assertIn("(sin cuentas registradas en Balance)", context)

    def test_omits_binance_section_when_not_connected(self):
        context = build_financial_context(self.user)
        self.assertNotIn("PORTAFOLIO BINANCE", context)

    def test_includes_binance_holdings_from_the_cached_snapshot(self):
        BinanceConnection.objects.create(
            user=self.user,
            api_key_encrypted="x",
            api_secret_encrypted="x",
            masked_key_preview="abcd…5678",
            last_balances=[{"asset": "BTC", "amount": 0.5}, {"asset": "USDT", "amount": 100.0}],
        )
        context = build_financial_context(self.user)
        self.assertIn("PORTAFOLIO BINANCE", context)
        self.assertIn("BTC: 0.5", context)
        self.assertIn("USDT: 100.0", context)
        # Nunca debe convertir cripto a pesos por su cuenta — no tiene el precio real.
        self.assertIn("No conviertas estas cantidades a pesos", context)

    def test_binance_section_notes_when_connected_but_never_synced(self):
        BinanceConnection.objects.create(
            user=self.user,
            api_key_encrypted="x",
            api_secret_encrypted="x",
            masked_key_preview="abcd…5678",
        )
        context = build_financial_context(self.user)
        self.assertIn("PORTAFOLIO BINANCE", context)
        self.assertIn("aún sin sincronizar", context)


class SanitizeHistoryTests(TestCase):
    def test_drops_invalid_roles_and_caps_length(self):
        history = [{"role": "system", "content": "ignore me"}] + [
            {"role": "user", "content": f"turn {i}"} for i in range(25)
        ]
        cleaned = _sanitize_history(history)
        self.assertEqual(len(cleaned), 20)
        self.assertTrue(all(turn["role"] == "user" for turn in cleaned))

    def test_drops_malformed_entries(self):
        history = [
            "not a dict",
            {"role": "user"},
            {"role": "user", "content": "  "},
            {"role": "user", "content": "hi"},
        ]
        cleaned = _sanitize_history(history)
        self.assertEqual(cleaned, [{"role": "user", "content": "hi"}])


class ResolveAccountTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="accountuser", password="password")
        self.entity = VisionEntity.objects.create(
            user=self.user, name="BBVA Débito", type="asset", amount=Decimal("1000.00")
        )

    def test_exact_case_insensitive_match(self):
        account_id, account_name = _resolve_account(self.user, "bbva débito")
        self.assertEqual(account_id, str(self.entity.id))
        self.assertEqual(account_name, "BBVA Débito")

    def test_substring_match_as_fallback(self):
        account_id, account_name = _resolve_account(self.user, "BBVA")
        self.assertEqual(account_id, str(self.entity.id))

    def test_no_match_returns_none_none(self):
        self.assertEqual(_resolve_account(self.user, "Cuenta que no existe"), (None, None))

    def test_empty_or_missing_name_returns_none_none(self):
        self.assertEqual(_resolve_account(self.user, ""), (None, None))
        self.assertEqual(_resolve_account(self.user, None), (None, None))

    def test_never_matches_another_users_account(self):
        other_user = User.objects.create_user(username="otheruser", password="password")
        self.assertEqual(_resolve_account(other_user, "BBVA Débito"), (None, None))


class ValidateCreateProposalTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chatuser2", password="password")

    def test_accepts_a_well_formed_proposal(self):
        result = _validate_create_proposal(
            self.user,
            {"amount": 250.5, "type": "expense", "description": "Supermercado", "category": "Comida"},
        )
        self.assertEqual(
            result,
            {
                "kind": "create",
                "transaction_id": None,
                "amount": 250.5,
                "type": "expense",
                "description": "Supermercado",
                "category": "Comida",
                "account_id": None,
                "account_name": None,
                "previous": None,
            },
        )

    def test_resolves_a_matching_account_name(self):
        entity = VisionEntity.objects.create(
            user=self.user, name="BBVA", type="asset", amount=Decimal("1000.00")
        )
        result = _validate_create_proposal(
            self.user,
            {"amount": 100, "type": "expense", "description": "x", "account_name": "bbva"},
        )
        self.assertEqual(result["account_id"], str(entity.id))
        self.assertEqual(result["account_name"], "BBVA")

    def test_category_and_account_are_optional(self):
        result = _validate_create_proposal(
            self.user, {"amount": 100, "type": "income", "description": "Nómina"}
        )
        self.assertIsNone(result["category"])
        self.assertIsNone(result["account_id"])

    def test_rejects_missing_or_invalid_amount(self):
        self.assertIsNone(
            _validate_create_proposal(self.user, {"type": "expense", "description": "x"})
        )
        self.assertIsNone(
            _validate_create_proposal(self.user, {"amount": 0, "type": "expense", "description": "x"})
        )
        self.assertIsNone(
            _validate_create_proposal(self.user, {"amount": -10, "type": "expense", "description": "x"})
        )
        self.assertIsNone(
            _validate_create_proposal(
                self.user, {"amount": "not a number", "type": "expense", "description": "x"}
            )
        )

    def test_rejects_nan_and_infinity(self):
        # float() parses "nan"/"inf" strings happily, and NaN comparisons are
        # always False — a naive `amount <= 0` guard alone would let them through.
        self.assertIsNone(
            _validate_create_proposal(self.user, {"amount": "nan", "type": "expense", "description": "x"})
        )
        self.assertIsNone(
            _validate_create_proposal(self.user, {"amount": "inf", "type": "expense", "description": "x"})
        )

    def test_rejects_invalid_type(self):
        self.assertIsNone(
            _validate_create_proposal(self.user, {"amount": 10, "type": "transfer", "description": "x"})
        )

    def test_rejects_empty_description(self):
        self.assertIsNone(
            _validate_create_proposal(self.user, {"amount": 10, "type": "expense", "description": "   "})
        )

    def test_rejects_non_dict_input(self):
        self.assertIsNone(_validate_create_proposal(self.user, "not a dict"))
        self.assertIsNone(_validate_create_proposal(self.user, None))


class ValidateEditProposalTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="edituser", password="password")
        self.tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("250.00"),
            type="expense",
            description="Supermercado",
            category="Comida",
            date=timezone.now(),
        )

    def test_partial_update_keeps_unspecified_fields_and_returns_previous(self):
        result = _validate_edit_proposal(
            self.user, {"transaction_id": str(self.tx.id), "amount": 300}
        )
        self.assertEqual(
            result,
            {
                "kind": "edit",
                "transaction_id": str(self.tx.id),
                "amount": 300.0,
                "type": "expense",
                "description": "Supermercado",
                "category": "Comida",
                "account_id": None,
                "account_name": None,
                "previous": {
                    "amount": 250.0,
                    "type": "expense",
                    "description": "Supermercado",
                    "category": "Comida",
                    "account_name": None,
                },
            },
        )

    def test_resolves_a_new_account_when_provided(self):
        entity = VisionEntity.objects.create(
            user=self.user, name="BBVA", type="asset", amount=Decimal("1000.00")
        )
        result = _validate_edit_proposal(
            self.user, {"transaction_id": str(self.tx.id), "account_name": "BBVA"}
        )
        self.assertEqual(result["account_id"], str(entity.id))
        self.assertEqual(result["account_name"], "BBVA")
        # Unspecified fields keep the transaction's current values.
        self.assertEqual(result["amount"], 250.0)

    def test_invalid_amount_override_is_ignored_not_rejected(self):
        result = _validate_edit_proposal(
            self.user, {"transaction_id": str(self.tx.id), "amount": "nan"}
        )
        self.assertIsNotNone(result)
        self.assertEqual(result["amount"], 250.0)

    def test_rejects_missing_transaction_id(self):
        self.assertIsNone(_validate_edit_proposal(self.user, {"amount": 100}))

    def test_rejects_nonexistent_transaction_id(self):
        self.assertIsNone(
            _validate_edit_proposal(self.user, {"transaction_id": "999999"})
        )

    def test_never_edits_another_users_transaction(self):
        other_user = User.objects.create_user(username="otheredituser", password="password")
        self.assertIsNone(
            _validate_edit_proposal(other_user, {"transaction_id": str(self.tx.id)})
        )

    def test_rejects_non_dict_input(self):
        self.assertIsNone(_validate_edit_proposal(self.user, "not a dict"))


class ValidateDeleteProposalTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="deleteuser", password="password")
        self.tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("250.00"),
            type="expense",
            description="Supermercado",
            category="Comida",
            date=timezone.now(),
        )

    def test_returns_the_transactions_current_data(self):
        result = _validate_delete_proposal(self.user, {"transaction_id": str(self.tx.id)})
        self.assertEqual(
            result,
            {
                "kind": "delete",
                "transaction_id": str(self.tx.id),
                "amount": 250.0,
                "type": "expense",
                "description": "Supermercado",
                "category": "Comida",
                "account_id": None,
                "account_name": None,
                "previous": None,
            },
        )

    def test_rejects_missing_transaction_id(self):
        self.assertIsNone(_validate_delete_proposal(self.user, {}))

    def test_rejects_nonexistent_transaction_id(self):
        self.assertIsNone(_validate_delete_proposal(self.user, {"transaction_id": "999999"}))

    def test_never_deletes_another_users_transaction(self):
        other_user = User.objects.create_user(username="otherdeleteuser", password="password")
        self.assertIsNone(
            _validate_delete_proposal(other_user, {"transaction_id": str(self.tx.id)})
        )


class BuildImageBlocksTests(TestCase):
    def test_no_images_returns_empty_list(self):
        self.assertEqual(build_image_blocks(None), [])
        self.assertEqual(build_image_blocks([]), [])

    def test_builds_an_anthropic_image_block(self):
        blocks = build_image_blocks([{"media_type": "image/jpeg", "data": "abc123"}])
        self.assertEqual(
            blocks,
            [
                {
                    "type": "image",
                    "source": {"type": "base64", "media_type": "image/jpeg", "data": "abc123"},
                }
            ],
        )

    def test_strips_a_data_url_prefix(self):
        blocks = build_image_blocks(
            [{"media_type": "image/png", "data": "data:image/png;base64,abc123"}]
        )
        self.assertEqual(blocks[0]["source"]["data"], "abc123")

    def test_rejects_unsupported_media_type(self):
        with self.assertRaises(ImagePayloadError):
            build_image_blocks([{"media_type": "application/pdf", "data": "abc"}])

    def test_rejects_too_many_images(self):
        images = [{"media_type": "image/jpeg", "data": "abc"}] * (MAX_IMAGES_PER_TURN + 1)
        with self.assertRaises(ImagePayloadError):
            build_image_blocks(images)

    def test_rejects_an_oversized_image(self):
        with self.assertRaises(ImagePayloadError):
            build_image_blocks(
                [{"media_type": "image/jpeg", "data": "a" * (MAX_IMAGE_BASE64_CHARS + 1)}]
            )

    def test_rejects_oversized_total_even_when_each_image_fits(self):
        # Cada una cabe por separado, pero juntas rebasan el body del serverless.
        images = [
            {"media_type": "image/jpeg", "data": "a" * MAX_IMAGE_BASE64_CHARS}
            for _ in range(3)
        ]
        with self.assertRaises(ImagePayloadError):
            build_image_blocks(images)

    def test_rejects_malformed_entries(self):
        with self.assertRaises(ImagePayloadError):
            build_image_blocks("not a list")
        with self.assertRaises(ImagePayloadError):
            build_image_blocks(["not a dict"])
        with self.assertRaises(ImagePayloadError):
            build_image_blocks([{"media_type": "image/jpeg", "data": "   "}])


class ChatEndpointTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chatapi", password="password")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_requires_authentication(self):
        anon_client = APIClient()
        response = anon_client.post(
            "/api/wallet/chat/message/", {"message": "hola"}, format="json"
        )
        self.assertEqual(response.status_code, 401)

    def test_rejects_empty_message(self):
        response = self.client.post(
            "/api/wallet/chat/message/", {"message": ""}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "message_required")

    @patch("wallet.views.get_chat_reply")
    def test_accepts_an_empty_message_when_images_are_attached(self, mock_get_chat_reply):
        # Una foto de un ticket enviada sola es una petición completa.
        mock_get_chat_reply.return_value = ("Veo un gasto de $250.00", [])
        response = self.client.post(
            "/api/wallet/chat/message/",
            {"message": "", "images": [{"media_type": "image/jpeg", "data": "abc"}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_rejects_images_the_model_cannot_take(self):
        response = self.client.post(
            "/api/wallet/chat/message/",
            {"message": "", "images": [{"media_type": "application/pdf", "data": "abc"}]},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "unsupported_image_type")

    def test_rejects_message_too_long(self):
        response = self.client.post(
            "/api/wallet/chat/message/", {"message": "a" * 1001}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "message_too_long")

    @patch("wallet.views.get_chat_reply")
    def test_returns_reply_from_ai_chat_module(self, mock_get_chat_reply):
        mock_get_chat_reply.return_value = ("Este mes has gastado $100.00", [])
        response = self.client.post(
            "/api/wallet/chat/message/",
            {"message": "¿Cuánto llevo gastado?", "history": []},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["reply"], "Este mes has gastado $100.00")
        self.assertNotIn("transaction_proposals", response.data)
        mock_get_chat_reply.assert_called_once()

    @patch("wallet.views.get_chat_reply")
    def test_includes_every_proposal_of_the_turn(self, mock_get_chat_reply):
        # Una captura de un listado puede traer varias transacciones a la vez.
        proposals = [
            {
                "kind": "create",
                "transaction_id": None,
                "amount": amount,
                "type": "expense",
                "description": description,
                "category": "Comida",
                "account_id": None,
                "account_name": None,
                "previous": None,
            }
            for amount, description in ((250.0, "Supermercado"), (80.0, "Café"))
        ]
        mock_get_chat_reply.return_value = ("Confírmalas abajo:", proposals)
        response = self.client.post(
            "/api/wallet/chat/message/",
            {"message": "", "images": [{"media_type": "image/jpeg", "data": "abc"}]},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["transaction_proposals"], proposals)

    @patch("wallet.views.get_chat_reply")
    def test_returns_502_when_ai_service_unavailable(self, mock_get_chat_reply):
        mock_get_chat_reply.side_effect = AnthropicServiceError("boom")
        response = self.client.post(
            "/api/wallet/chat/message/", {"message": "hola"}, format="json"
        )
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data["error"], "ai_service_unavailable")
