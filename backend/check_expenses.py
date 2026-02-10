import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from wallet.models import Transaction
from django.db.models import Sum

txs = Transaction.objects.filter(
    date__year=2026, 
    date__month=2,
    type='expense'
).values('id', 'date', 'amount', 'description')

print(f"Total Expense Txs in Feb (UTC): {len(txs)}")
total = 0
for t in txs:
    print(f"ID: {t['id']}, Amt: {t['amount']}, Desc: {t['description']}")
    total += t['amount']
print(f"Total: {total}")
