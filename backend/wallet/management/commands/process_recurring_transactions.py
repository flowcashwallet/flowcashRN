from django.core.management.base import BaseCommand
from django.utils import timezone
from wallet.models import Transaction
from dateutil.relativedelta import relativedelta

class Command(BaseCommand):
    help = 'Process recurring transactions and generate new ones if due'

    def handle(self, *args, **options):
        now = timezone.now()
        recurring_transactions = Transaction.objects.filter(is_recurring=True)
        
        count = 0
        for tx in recurring_transactions:
            # Determine the last processed date (or original date if never processed)
            base_date = tx.last_recurrence_date if tx.last_recurrence_date else tx.date
            
            # Calculate next occurrence
            if tx.recurrence_frequency == 'weekly':
                next_date = base_date + relativedelta(weeks=1)
            elif tx.recurrence_frequency == 'monthly':
                next_date = base_date + relativedelta(months=1)
            elif tx.recurrence_frequency == 'yearly':
                next_date = base_date + relativedelta(years=1)
            else:
                continue

            # Check if it's due
            if next_date <= now:
                # Create new transaction
                Transaction.objects.create(
                    user=tx.user,
                    amount=tx.amount,
                    type=tx.type,
                    description=tx.description,
                    category=tx.category,
                    related_entity_id=tx.related_entity_id,
                    transfer_related_entity_id=tx.transfer_related_entity_id,
                    date=next_date,
                    payment_type=tx.payment_type,
                    is_recurring=False, # Child is not recurring by default (prevents exponential loop)
                    recurrence_frequency=None
                )
                
                # Update parent
                tx.last_recurrence_date = next_date
                tx.save()
                
                count += 1
                self.stdout.write(self.style.SUCCESS(f'Generated recurring transaction for: {tx.description} ({next_date.date()})'))

        self.stdout.write(self.style.SUCCESS(f'Successfully processed {count} recurring transactions'))
