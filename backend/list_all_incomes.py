import os
import django
from django.conf import settings
from django.db.models import Sum

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from wallet.models import Transaction
from django.contrib.auth import get_user_model

User = get_user_model()
user = User.objects.get(id=7)

print("--- Listing ALL Income Transactions for User 7 ---")
incomes = Transaction.objects.filter(user=user, type='income').order_by('date')
total = 0
for t in incomes:
    print(f"ID: {t.id} | Date: {t.date} | Amount: {t.amount} | Desc: {t.description}")
    total += float(t.amount)

print(f"Total Income All Time: {total}")
print(f"User sees: 186437")
print(f"Difference: {186437 - total}")
