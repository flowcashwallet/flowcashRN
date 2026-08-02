from django.core.management.base import BaseCommand
from wallet.recurrence import process_recurring_transactions

class Command(BaseCommand):
    help = 'Process recurring transactions and generate new ones if due'

    def handle(self, *args, **options):
        result = process_recurring_transactions()

        for item in result["generated"]:
            self.stdout.write(
                self.style.SUCCESS(
                    f'Generated recurring transaction for: {item["description"]} ({item["date"]})'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully processed {result["processed"]} recurring transactions'
            )
        )
