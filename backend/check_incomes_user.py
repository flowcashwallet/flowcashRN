import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from wallet.models import Transaction

txs = Transaction.objects.filter(
    user__id=7,
    date__year=2026, 
    date__month=2,
    type='income'
).values('id', 'amount', 'description')

print(f"Total Income Txs in Feb (User 7): {len(txs)}")
total = 0
for t in txs:
    print(f"ID: {t['id']}, Amt: {t['amount']}, Desc: {t['description']}")
    total += t['amount']
print(f"Total: {total}")
