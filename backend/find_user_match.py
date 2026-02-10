import os
import django
from django.conf import settings
from django.db.models import Sum

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from wallet.models import Transaction
from django.contrib.auth import get_user_model

User = get_user_model()

print("--- Scanning ALL Users for Income ~186k ---")

users = User.objects.all()
for u in users:
    # Check Feb Income
    feb_income = Transaction.objects.filter(
        user=u, 
        type='income', 
        date__year=2026, 
        date__month=2
    ).aggregate(Sum('amount'))['amount__sum'] or 0
    
    # Check All Time Income
    total_income = Transaction.objects.filter(
        user=u, 
        type='income'
    ).aggregate(Sum('amount'))['amount__sum'] or 0
    
    # Check Jan+Feb Income
    jan_feb_income = Transaction.objects.filter(
        user=u,
        type='income',
        date__year=2026,
        date__month__in=[1, 2]
    ).aggregate(Sum('amount'))['amount__sum'] or 0

    print(f"User {u.id} ({u.username}): Feb={feb_income}, Jan+Feb={jan_feb_income}, Total={total_income}")
    
    if 180000 <= jan_feb_income <= 190000:
        print(f"!!! MATCH FOUND (Jan+Feb) for User {u.id} !!!")
        
    if 180000 <= feb_income <= 190000:
        print(f"!!! MATCH FOUND (Feb) for User {u.id} !!!")

