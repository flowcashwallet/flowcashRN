from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from .ai_chat import AnthropicServiceError, _sanitize_history, build_financial_context
from .models import Budget, FixedExpense, Transaction


class BuildFinancialContextTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="chatuser", password="password")
        self.budget = Budget.objects.create(
            user=self.user, monthly_income=Decimal("10000.00"), is_setup=True
        )
        FixedExpense.objects.create(
            budget=self.budget, name="Renta", amount=Decimal("3000.00"), category="Vivienda"
        )
        Transaction.objects.create(
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

    def test_handles_user_without_budget_or_transactions(self):
        other_user = User.objects.create_user(username="nobudget", password="password")
        context = build_financial_context(other_user)
        self.assertNotIn("GASTOS FIJOS", context)
        self.assertIn("(sin transacciones registradas)", context)


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

    def test_rejects_message_too_long(self):
        response = self.client.post(
            "/api/wallet/chat/message/", {"message": "a" * 1001}, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["error"], "message_too_long")

    @patch("wallet.views.get_chat_reply")
    def test_returns_reply_from_ai_chat_module(self, mock_get_chat_reply):
        mock_get_chat_reply.return_value = "Este mes has gastado $100.00"
        response = self.client.post(
            "/api/wallet/chat/message/",
            {"message": "¿Cuánto llevo gastado?", "history": []},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["reply"], "Este mes has gastado $100.00")
        mock_get_chat_reply.assert_called_once()

    @patch("wallet.views.get_chat_reply")
    def test_returns_502_when_ai_service_unavailable(self, mock_get_chat_reply):
        mock_get_chat_reply.side_effect = AnthropicServiceError("boom")
        response = self.client.post(
            "/api/wallet/chat/message/", {"message": "hola"}, format="json"
        )
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.data["error"], "ai_service_unavailable")
