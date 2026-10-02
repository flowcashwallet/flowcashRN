from django.core.management.base import BaseCommand
from django.utils import timezone

from dateutil.relativedelta import relativedelta

from wallet.models import Transaction
from wallet.recurrence import USER_TZ, _as_local_date, _get_next_date


class Command(BaseCommand):
    """
    Read-only diagnostic: prints exactly what `process_recurring_transactions`
    computes for each recurring transaction, without creating anything.
    Use --contains to filter by description (e.g. --contains Netflix).
    """

    help = "Show the recurrence computation for recurring transactions without generating anything"

    def add_arguments(self, parser):
        parser.add_argument("--contains", type=str, default=None)

    def handle(self, *args, **options):
        now = timezone.now()
        today = now.astimezone(USER_TZ).date()
        self.stdout.write(self.style.SUCCESS(f"now (UTC)      = {now.isoformat()}"))
        self.stdout.write(self.style.SUCCESS(f"today (Mexico) = {today.isoformat()}"))
        self.stdout.write("")

        qs = Transaction.objects.filter(is_recurring=True)
        contains = options.get("contains")
        if contains:
            qs = qs.filter(description__icontains=contains)

        if not qs.exists():
            self.stdout.write(self.style.WARNING("No recurring transactions matched."))
            return

        for tx in qs:
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

            self.stdout.write(self.style.MIGRATE_HEADING(f"#{tx.id} {tx.description!r}"))
            self.stdout.write(f"  recurrence_frequency = {tx.recurrence_frequency}")
            self.stdout.write(f"  date (raw)            = {tx.date.isoformat()}")
            self.stdout.write(f"  date (Mexico date)    = {start_date.isoformat()}")
            self.stdout.write(
                f"  last_recurrence_date (raw)        = {tx.last_recurrence_date.isoformat() if tx.last_recurrence_date else None}"
            )
            self.stdout.write(f"  base_date (Mexico)    = {base_date.isoformat()}")
            self.stdout.write(f"  next_date             = {next_date.isoformat() if next_date else None}")
            self.stdout.write(f"  end_date              = {end_date.isoformat() if end_date else None}")
            will_generate = bool(next_date) and next_date <= today and not (end_date and next_date > end_date)
            self.stdout.write(
                (self.style.SUCCESS if will_generate else self.style.ERROR)(
                    f"  => would generate today? {will_generate}"
                )
            )
            self.stdout.write("")
