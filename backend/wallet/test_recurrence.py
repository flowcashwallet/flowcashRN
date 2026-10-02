"""
Tests for recurring-transaction generation (`recurrence.py`). There were
zero tests for this before — the timezone bug this closes (day boundaries
computed in the server's UTC instead of the user's real calendar day) went
unnoticed because of that gap.
"""
import zoneinfo
from datetime import datetime, timezone as dt_timezone
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth.models import User
from django.test import TestCase
from django.utils import timezone as django_timezone
from rest_framework.test import APIClient

from .models import Transaction
from .recurrence import USER_TZ, process_recurring_transactions

MEXICO_TZ = zoneinfo.ZoneInfo("America/Mexico_City")


def _mexico(year, month, day, hour=0, minute=0):
    """Builds a tz-aware datetime directly in America/Mexico_City."""
    return datetime(year, month, day, hour, minute, tzinfo=MEXICO_TZ)


class ProcessRecurringTransactionsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="recuser", password="password")

    def _make_recurring(self, anchor_date, frequency="monthly", description="Renta", **extra):
        return Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="expense",
            description=description,
            category="Vivienda",
            date=anchor_date,
            is_recurring=True,
            recurrence_frequency=frequency,
            **extra,
        )

    def test_generates_a_child_on_the_due_date_in_mexico_time(self):
        # Anchored on Sep 1st (Mexico midnight) — next occurrence is Oct 1st.
        tx = self._make_recurring(_mexico(2026, 9, 1))

        result = process_recurring_transactions(now=_mexico(2026, 10, 1, 6, 0))

        self.assertEqual(result["processed"], 1)
        child = Transaction.objects.exclude(id=tx.id).get()
        self.assertEqual(child.description, "Renta")
        self.assertFalse(child.is_recurring)
        # The regression this fixes: the child's own date, read back in the
        # user's timezone, must land on Oct 1st — not Sep 30th or Oct 2nd.
        self.assertEqual(child.date.astimezone(MEXICO_TZ).date().isoformat(), "2026-10-01")

    def test_does_not_generate_before_the_due_date(self):
        self._make_recurring(_mexico(2026, 9, 1))

        result = process_recurring_transactions(now=_mexico(2026, 9, 30, 23, 0))

        self.assertEqual(result["processed"], 0)
        self.assertEqual(Transaction.objects.count(), 1)  # just the anchor

    def test_a_cron_run_that_landed_in_utc_tomorrow_does_not_generate_early(self):
        # The exact shape of the bug this fixes: a cron tick at 02:00 UTC on
        # Oct 1st is already "Oct 1st" in UTC, but it's still Sep 30th,
        # 8:00 PM in Mexico City (UTC-6) — the recurrence must NOT fire yet.
        self._make_recurring(_mexico(2026, 9, 1))
        now_utc = datetime(2026, 10, 1, 2, 0, tzinfo=dt_timezone.utc)
        self.assertEqual(now_utc.astimezone(MEXICO_TZ).date().isoformat(), "2026-09-30")

        result = process_recurring_transactions(now=now_utc)

        self.assertEqual(result["processed"], 0)

    def test_respects_recurrence_months_and_turns_off_after_the_end_date(self):
        tx = self._make_recurring(_mexico(2026, 8, 1), recurrence_months=1)
        # One month in (Sep 1st) is still within the 1-month window.
        process_recurring_transactions(now=_mexico(2026, 9, 1, 6, 0))
        tx.refresh_from_db()
        self.assertTrue(tx.is_recurring)

        # Two months in (Oct 1st) is past the 1-month end date — turns off,
        # no further child generated for this transaction.
        before = Transaction.objects.count()
        process_recurring_transactions(now=_mexico(2026, 10, 1, 6, 0))
        tx.refresh_from_db()
        self.assertFalse(tx.is_recurring)
        self.assertEqual(Transaction.objects.count(), before)

    def test_weekly_and_yearly_frequencies(self):
        self._make_recurring(_mexico(2026, 9, 1), frequency="weekly", description="Suscripción")
        self._make_recurring(_mexico(2025, 10, 1), frequency="yearly", description="Seguro")

        result = process_recurring_transactions(now=_mexico(2026, 10, 1, 6, 0))

        self.assertEqual(result["processed"], 2)
        weekly_child = Transaction.objects.get(description="Suscripción", is_recurring=False)
        self.assertEqual(weekly_child.date.astimezone(MEXICO_TZ).date().isoformat(), "2026-09-08")
        yearly_child = Transaction.objects.get(description="Seguro", is_recurring=False)
        self.assertEqual(yearly_child.date.astimezone(MEXICO_TZ).date().isoformat(), "2026-10-01")


class TransactionListCatchUpTests(TestCase):
    """`TransactionViewSet.list` opportunistically runs the recurrence catch-up."""

    def setUp(self):
        self.user = User.objects.create_user(username="listuser", password="password")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    @patch("wallet.views.process_recurring_transactions")
    def test_list_triggers_the_recurrence_catch_up(self, mock_process):
        mock_process.return_value = {"processed": 0, "generated": []}
        response = self.client.get("/api/wallet/transactions/")
        self.assertEqual(response.status_code, 200)
        mock_process.assert_called_once()

    @patch("wallet.views.process_recurring_transactions")
    def test_list_still_works_if_the_catch_up_raises(self, mock_process):
        mock_process.side_effect = Exception("boom")
        response = self.client.get("/api/wallet/transactions/")
        self.assertEqual(response.status_code, 200)


class FixLegacyRecurrenceDatesMigrationTests(TestCase):
    """
    `0012_fix_legacy_recurrence_dates` re-anchors `last_recurrence_date`
    values stamped at UTC midnight by the pre-fix code (see recurrence.py)
    so they read back as the originally-intended calendar day in Mexico
    time, instead of one day early.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="miguser", password="password")

    def test_legacy_utc_midnight_value_is_shifted_to_mexico_midnight(self):
        from importlib import import_module

        module = import_module("wallet.migrations.0012_fix_legacy_recurrence_dates")

        tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="expense",
            description="Renta",
            category="Vivienda",
            date=_mexico(2026, 8, 1),
            is_recurring=True,
            recurrence_frequency="monthly",
            last_recurrence_date=datetime(2026, 9, 1, 0, 0, tzinfo=dt_timezone.utc),
        )

        class _FakeApps:
            def get_model(self, app_label, model_name):
                assert (app_label, model_name) == ("wallet", "Transaction")
                return Transaction

        module.fix_legacy_recurrence_dates(_FakeApps(), None)

        tx.refresh_from_db()
        self.assertEqual(
            tx.last_recurrence_date.astimezone(MEXICO_TZ),
            _mexico(2026, 9, 1),
        )

    def test_already_correct_value_is_left_untouched(self):
        from importlib import import_module

        module = import_module("wallet.migrations.0012_fix_legacy_recurrence_dates")

        correct_value = _mexico(2026, 9, 1)
        tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="expense",
            description="Renta",
            category="Vivienda",
            date=_mexico(2026, 8, 1),
            is_recurring=True,
            recurrence_frequency="monthly",
            last_recurrence_date=correct_value,
        )

        class _FakeApps:
            def get_model(self, app_label, model_name):
                return Transaction

        module.fix_legacy_recurrence_dates(_FakeApps(), None)

        tx.refresh_from_db()
        self.assertEqual(tx.last_recurrence_date.astimezone(MEXICO_TZ), correct_value)


class RealignRecurrenceAnchorDayMigrationTests(TestCase):
    """
    `0013_realign_recurrence_anchor_day` fixes the "Netflix" case: a
    transaction anchored on the 2nd (Mexico time) whose very first
    `start_date` was miscalculated against the UTC day (the 3rd) by the
    pre-fix code, so every monthly cycle since kept landing on the 3rd
    instead of the 2nd.
    """

    def setUp(self):
        self.user = User.objects.create_user(username="realignuser", password="password")

    def _migration_fn(self):
        from importlib import import_module

        return import_module("wallet.migrations.0013_realign_recurrence_anchor_day").realign_recurrence_anchor_day

    def test_corrects_a_day_of_month_drifted_by_the_legacy_bug(self):
        # Created April 3rd 03:30 UTC — still April 2nd, 9:30 PM in Mexico.
        anchor = datetime(2026, 4, 3, 3, 30, tzinfo=dt_timezone.utc)
        tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("249.00"),
            type="expense",
            description="Netflix",
            category="Entretenimiento",
            date=anchor,
            is_recurring=True,
            recurrence_frequency="monthly",
            # Poisoned by the legacy bug: landed on the 3rd every month
            # instead of the 2nd.
            last_recurrence_date=_mexico(2026, 9, 3),
        )

        class _FakeApps:
            def get_model(self, app_label, model_name):
                return Transaction

        self._migration_fn()(_FakeApps(), None)

        tx.refresh_from_db()
        self.assertEqual(tx.last_recurrence_date.astimezone(MEXICO_TZ), _mexico(2026, 9, 2))

        # And the next cycle now correctly lands on Oct 2nd, not Oct 3rd.
        result = process_recurring_transactions(now=_mexico(2026, 10, 2, 6, 0))
        self.assertEqual(result["processed"], 1)
        child = Transaction.objects.get(description="Netflix", is_recurring=False)
        self.assertEqual(child.date.astimezone(MEXICO_TZ).date().isoformat(), "2026-10-02")

    def test_leaves_an_unaffected_transaction_untouched(self):
        # Anchor's UTC day and Mexico day already match — no drift to fix.
        anchor = _mexico(2026, 4, 2, 10, 0)
        correct_value = _mexico(2026, 9, 2)
        tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="expense",
            description="Spotify",
            category="Entretenimiento",
            date=anchor,
            is_recurring=True,
            recurrence_frequency="monthly",
            last_recurrence_date=correct_value,
        )

        class _FakeApps:
            def get_model(self, app_label, model_name):
                return Transaction

        self._migration_fn()(_FakeApps(), None)

        tx.refresh_from_db()
        self.assertEqual(tx.last_recurrence_date.astimezone(MEXICO_TZ), correct_value)
