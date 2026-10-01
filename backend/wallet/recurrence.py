import zoneinfo
from datetime import datetime, time

from django.utils import timezone
from dateutil.relativedelta import relativedelta

from .models import Transaction

# Matches ai_chat.py's USER_TZ. A recurrence like "the 1st of the month" is
# a date in the USER's calendar, not the server's — Django's TIME_ZONE is
# 'UTC', so `timezone.get_current_timezone()` used to resolve to UTC despite
# being named "local_tz", shifting the day boundary used for both "today"
# and the generated transaction's own date away from the user's real day.
USER_TZ = zoneinfo.ZoneInfo("America/Mexico_City")


def _as_local_date(value):
    """Normalize a DateTimeField value to its calendar date in the user's timezone."""
    if timezone.is_aware(value):
        return value.astimezone(USER_TZ).date()
    return value.date()


def _get_next_date(base_date, frequency):
    """Return the next occurrence based on frequency."""
    if frequency == "weekly":
        return base_date + relativedelta(weeks=1)
    elif frequency == "monthly":
        return base_date + relativedelta(months=1)
    elif frequency == "yearly":
        return base_date + relativedelta(years=1)
    return None


def process_recurring_transactions(now=None):
    """
    Generate child transactions for due recurring transactions.

    Uses date-based comparison, in the user's own timezone (not the
    server's), so a charge scheduled for "the 1st of the month" appears on
    the 1st of the user's day regardless of the original creation time or
    of what timezone the server/cron happens to run in. New child
    transactions are created at midnight in the user's timezone.

    Returns a dict with the count of generated transactions and a list of
    generated transaction details.
    """
    if now is None:
        now = timezone.now()

    today = now.astimezone(USER_TZ).date() if timezone.is_aware(now) else now.date()
    recurring_transactions = Transaction.objects.filter(is_recurring=True)

    generated = []
    for tx in recurring_transactions:
        if not tx.recurrence_frequency:
            continue

        start_date = _as_local_date(tx.date)
        end_date = None
        if tx.recurrence_months:
            end_date = start_date + relativedelta(months=tx.recurrence_months)

        base_date = (
            _as_local_date(tx.last_recurrence_date)
            if tx.last_recurrence_date
            else start_date
        )

        next_date = _get_next_date(base_date, tx.recurrence_frequency)
        if not next_date:
            continue

        if end_date and next_date > end_date:
            tx.is_recurring = False
            tx.save(update_fields=["is_recurring"])
            continue

        if next_date <= today:
            child_datetime = datetime.combine(next_date, time.min, tzinfo=USER_TZ)

            Transaction.objects.create(
                user=tx.user,
                amount=tx.amount,
                type=tx.type,
                description=tx.description,
                category=tx.category,
                related_entity_id=tx.related_entity_id,
                transfer_related_entity_id=tx.transfer_related_entity_id,
                date=child_datetime,
                payment_type=tx.payment_type,
                is_recurring=False,
                recurrence_frequency=None,
            )

            tx.last_recurrence_date = child_datetime
            tx.save()

            generated.append(
                {
                    "description": tx.description,
                    "date": next_date.isoformat(),
                }
            )

    return {"processed": len(generated), "generated": generated}
