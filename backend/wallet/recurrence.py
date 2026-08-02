from datetime import date, datetime, time
from django.utils import timezone
from dateutil.relativedelta import relativedelta

from .models import Transaction


def _as_local_date(value):
    """Normalize a DateTimeField value to a local date using Django's current timezone."""
    if timezone.is_aware(value):
        return timezone.localdate(value)
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

    Uses date-based comparison so a charge scheduled for "the 1st of the month"
    appears on the 1st regardless of the original creation time. New child
    transactions are created at midnight local time.

    Returns a dict with the count of generated transactions and a list of
    generated transaction details.
    """
    if now is None:
        now = timezone.now()

    today = timezone.localdate(now)
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
            local_tz = timezone.get_current_timezone()
            child_datetime = timezone.make_aware(
                datetime.combine(next_date, time.min),
                local_tz,
            )

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
