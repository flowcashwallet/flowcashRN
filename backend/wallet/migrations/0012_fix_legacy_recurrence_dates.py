from datetime import datetime, time, timezone as dt_timezone
import zoneinfo

from django.db import migrations

USER_TZ = zoneinfo.ZoneInfo("America/Mexico_City")


def fix_legacy_recurrence_dates(apps, schema_editor):
    """
    `last_recurrence_date` used to be stamped at UTC midnight (the server-tz
    bug fixed alongside this migration — see recurrence.py). The code now
    reads it back in America/Mexico_City, so any value still sitting at
    exact UTC midnight is a day short of what it was meant to represent and
    needs re-anchoring to Mexico midnight of that same intended calendar day.

    This only touches `last_recurrence_date`, an internal bookkeeping field
    the app never shows the user and nothing else ever writes to — it does
    not touch `Transaction.date` on any real transaction.
    """
    Transaction = apps.get_model("wallet", "Transaction")

    for tx in Transaction.objects.filter(last_recurrence_date__isnull=False):
        value = tx.last_recurrence_date
        utc_value = value.astimezone(dt_timezone.utc)
        if (utc_value.hour, utc_value.minute, utc_value.second, utc_value.microsecond) != (0, 0, 0, 0):
            continue  # not the legacy signature — leave it alone

        intended_date = utc_value.date()
        tx.last_recurrence_date = datetime.combine(intended_date, time.min, tzinfo=USER_TZ)
        tx.save(update_fields=["last_recurrence_date"])


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ("wallet", "0011_binanceconnection_last_balances"),
    ]

    operations = [
        migrations.RunPython(fix_legacy_recurrence_dates, noop_reverse),
    ]
