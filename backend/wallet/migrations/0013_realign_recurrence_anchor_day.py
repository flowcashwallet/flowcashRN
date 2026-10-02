import zoneinfo
from datetime import datetime, time

from dateutil.relativedelta import relativedelta
from django.db import migrations
from django.utils import timezone as django_timezone

USER_TZ = zoneinfo.ZoneInfo("America/Mexico_City")


def _local_date(value):
    if django_timezone.is_aware(value):
        return value.astimezone(USER_TZ).date()
    return value.date()


def _step(frequency, base_date):
    if frequency == "weekly":
        return base_date + relativedelta(weeks=1)
    elif frequency == "monthly":
        return base_date + relativedelta(months=1)
    elif frequency == "yearly":
        return base_date + relativedelta(years=1)
    return None


def realign_recurrence_anchor_day(apps, schema_editor):
    """
    Some recurring transactions were first anchored by a `date` whose UTC
    calendar day differs from its Mexico calendar day (e.g. created late at
    night, when UTC has already rolled to the next day). Under the pre-fix
    code, `start_date` was computed from the wrong (UTC) day, so every later
    monthly/weekly/yearly cycle inherited that same day-of-month offset —
    e.g. a transaction anchored on the 2nd kept generating on the 3rd.

    This re-derives the correct day-of-month purely from `date` (now read
    correctly in Mexico time, see recurrence.py) and walks the same cadence
    forward to find the cycle boundary consistent with however many cycles
    have already elapsed — it does not regenerate or rename any transaction
    already created, only corrects this bookkeeping field so the *next*
    generation lands on the right day going forward. A no-op for rows that
    were never affected (anchor's UTC/Mexico day already matched).
    """
    Transaction = apps.get_model("wallet", "Transaction")

    for tx in Transaction.objects.filter(is_recurring=True, last_recurrence_date__isnull=False):
        if tx.recurrence_frequency not in ("weekly", "monthly", "yearly"):
            continue

        start_date = _local_date(tx.date)
        stored_date = _local_date(tx.last_recurrence_date)

        aligned = start_date
        for _ in range(1000):
            candidate = _step(tx.recurrence_frequency, aligned)
            if candidate is None or candidate > stored_date:
                break
            aligned = candidate

        if aligned == stored_date:
            continue

        tx.last_recurrence_date = datetime.combine(aligned, time.min, tzinfo=USER_TZ)
        tx.save(update_fields=["last_recurrence_date"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("wallet", "0012_fix_legacy_recurrence_dates"),
    ]

    operations = [
        migrations.RunPython(realign_recurrence_anchor_day, noop_reverse),
    ]
