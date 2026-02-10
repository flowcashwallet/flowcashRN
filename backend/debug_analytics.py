import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from wallet.models import Transaction, Budget
from django.db.models import Sum, Q
from django.utils import timezone

today = timezone.now()
cm = today.month
cy = today.year

print(f"--- Analyzing for Month {cm}/{cy} ---")

for budget in Budget.objects.all():
    user = budget.user
    income = budget.monthly_income
    
    expenses = Transaction.objects.filter(
        user=user, 
        type='expense',
        date__month=cm,
        date__year=cy
    )
    total_expenses = expenses.aggregate(Sum('amount'))['amount__sum'] or 0
    
    print(f"\nUser: {user.username}")
    print(f"  Budget Income: {income}")
    print(f"  Total Expenses (Raw): {total_expenses}")
    
    # Check filtering
    filtered_expenses = expenses.exclude(
        Q(category__icontains='transferencia') | 
        Q(category__icontains='transfer') |
        Q(description__icontains='transferencia')
    )
    total_filtered = filtered_expenses.aggregate(Sum('amount'))['amount__sum'] or 0
    print(f"  Total Expenses (Filtered): {total_filtered}")
    print(f"  Remaining (approx): {income - total_filtered}")

    print("  Top 5 Largest Expenses:")
    for t in expenses.order_by('-amount')[:5]:
        print(f"    - ${t.amount} | Cat: {t.category} | Desc: {t.description} | Type: {t.type}")
