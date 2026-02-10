
import os
import django
import datetime
from django.utils import timezone

# Configure Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth import get_user_model
from wallet.models import Transaction, Budget, FixedExpense
from wallet.analytics import predict_runway

def test_forecasting():
    User = get_user_model()
    user, created = User.objects.get_or_create(username='test_forecast_user', defaults={'email': 'forecast@example.com'})
    
    # 1. Setup Budget
    # Monthly Income: 5000
    # Fixed Expenses: 1000
    # Disposable: 4000
    budget, _ = Budget.objects.get_or_create(user=user)
    budget.monthly_income = 5000
    budget.save()
    
    FixedExpense.objects.filter(budget=budget).delete()
    FixedExpense.objects.create(budget=budget, name="Rent", amount=1000, category="Housing")
    
    print(f"Budget Setup: Income=5000, Fixed=1000, Disposable=4000")
    
    # 2. Setup Historical Transactions (High Burn Rate Scenario)
    # Spending 200 per day for the last 30 days.
    Transaction.objects.filter(user=user).delete()
    
    today = timezone.now()
    print("Creating historical transactions (last 30 days, 200/day)...")
    for i in range(1, 31):
        date = today - datetime.timedelta(days=i)
        Transaction.objects.create(
            user=user,
            amount=200.0,
            type='expense',
            description=f"Daily Expense {i}",
            category="Daily",
            date=date
        )
        
    # 3. Predict
    # Expected:
    # Burn Rate ~ 200
    # Current Expenses (last ~9 days of Feb) ~ 1800
    # Remaining ~ 2200
    # Days left ~ 11 days.
    # Warning expected.
    
    print("Running Prediction...")
    result = predict_runway(user)
    
    print("\nForecast Result:")
    for k, v in result.items():
        print(f"{k}: {v}")
        
    if result['status'] == 'warning':
        print("\n✅ SUCCESS: Warning triggered correctly.")
    else:
        print(f"\n❌ FAILURE: Expected warning, got {result['status']}")

if __name__ == '__main__':
    try:
        test_forecasting()
    except Exception as e:
        print(f"Error: {e}")
