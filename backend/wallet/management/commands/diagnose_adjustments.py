from django.core.management.base import BaseCommand

from wallet.models import Transaction, VisionEntity


class Command(BaseCommand):
    """
    Read-only: shows the most recent Transaction rows (any type) and the
    most recently updated VisionEntity rows, to check whether a manual
    balance edit actually created an 'adjustment' transaction. Creates or
    changes nothing.
    """

    help = "List recent transactions and entities to debug the adjustment-logging feature"

    def add_arguments(self, parser):
        parser.add_argument("--limit", type=int, default=10)

    def handle(self, *args, **options):
        limit = options["limit"]

        self.stdout.write(self.style.MIGRATE_HEADING(f"Last {limit} transactions (any type):"))
        for tx in Transaction.objects.order_by("-id")[:limit]:
            self.stdout.write(
                f"  #{tx.id} type={tx.type!r} amount={tx.amount} "
                f"related_entity_id={tx.related_entity_id!r} "
                f"description={tx.description!r} date={tx.date.isoformat()}"
            )

        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING(f"Last {limit} entities by updated_at:"))
        for ent in VisionEntity.objects.order_by("-updated_at")[:limit]:
            self.stdout.write(
                f"  #{ent.id} name={ent.name!r} type={ent.type!r} amount={ent.amount} "
                f"updated_at={ent.updated_at.isoformat()}"
            )
