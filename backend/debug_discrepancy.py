import os
import django
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum, Q

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from wallet.models import Transaction
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(id=7)

# 1. Check for the "Garbage" Transactions (Verification)
ids_to_check = [89, 91, 95, 90, 98, 119]
print(f"--- Checking existence of deleted IDs: {ids_to_check} ---")
found = Transaction.objects.filter(id__in=ids_to_check)
print(f"Found {found.count()} transactions (Should be 0).")
for t in found:
    print(f"ALIVE: ID {t.id} - {t.amount} - {t.type} - {t.date}")

# 2. Hunt for the $186,437 Income
print("\n--- Hunting for Income Source ($186k) ---")
# Look in a wide range (Jan 1st to Now)
start_date = timezone.datetime(2026, 1, 1, tzinfo=timezone.utc)
end_date = timezone.now()

incomes = Transaction.objects.filter(
    user=user, 
    type='income',
    date__gte=start_date
).order_by('date')

total_income_found = 0
print(f"Listing ALL Incomes since {start_date}:")
for t in incomes:
    print(f"ID: {t.id} | Date: {t.date} | Amount: {t.amount} | Desc: {t.description}")
    total_income_found += float(t.amount)

print(f"Total Income Found: {total_income_found}")

# 3. Check Expenses for Discrepancy
print("\n--- Hunting for Expense Discrepancy ($58k vs $56k) ---")
expenses = Transaction.objects.filter(
    user=user,
    type='expense',
    date__year=2026,
    date__month=2 # UTC February
)
total_expenses = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
print(f"Total Expenses (UTC Feb): {total_expenses}")

