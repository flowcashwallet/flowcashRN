import datetime
from django.utils import timezone
from django.db.models import Sum, Q
from calendar import monthrange
from .models import Transaction, Budget, FixedExpense

def get_exclusion_filter():
    return (
        Q(type='transfer') 
    )

def get_total_expenses_sum(user, start_date, end_date):
    """
    Returns the raw total sum of expenses for a period, excluding ONLY
    explicit transfers/keywords. Does NOT apply IQR outlier detection.
    Used for 'How much have I spent?' (Absolute Truth).
    """
    exclusion_filter = get_exclusion_filter()
    
    total = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[start_date, end_date]
    ).exclude(exclusion_filter).aggregate(Sum('amount'))['amount__sum'] or 0
    
    return float(total)

def get_adjusted_expenses_sum(user, start_date, end_date):
    """
    Returns the total sum of expenses for a period, excluding:
    1. Explicit transfers/keywords
    2. Statistical outliers (IQR method) like massive mislabeled transfers
    
    Used for 'What is my typical spending speed?' (Trend Analysis).
    """
    exclusion_filter = get_exclusion_filter()
    
    transactions = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[start_date, end_date]
    ).exclude(exclusion_filter).values('amount', 'date')
    
    if not transactions:
        return 0.0
        
    # Group by day
    daily_totals = {}
    for tx in transactions:
        date_key = tx['date'].date()
        amount = float(tx['amount'])
        daily_totals[date_key] = daily_totals.get(date_key, 0) + amount
        
    daily_values = list(daily_totals.values())
    
    # Apply IQR Outlier Detection
    if len(daily_values) >= 5:
        sorted_values = sorted(daily_values)
        n = len(sorted_values)
        q1_index = int(n * 0.25)
        q3_index = int(n * 0.75)
        q1 = sorted_values[q1_index]
        q3 = sorted_values[q3_index]
        iqr = q3 - q1
        upper_fence = q3 + (1.5 * iqr)
        
        cleaned_values = [v for v in daily_values if v <= upper_fence]
        return sum(cleaned_values)
    else:
        return sum(daily_values)

def calculate_burn_rate(user, days=180):
    """
    Calculates the average daily variable expense (burn rate) over the last N days.
    Adjusts N if the user's history is shorter than N days.
    """
    end_date = timezone.now()
    
    # Check first transaction date (ANY type) to adjust 'days' if history is short
    first_transaction = Transaction.objects.filter(user=user).order_by('date').first()
    
    if not first_transaction:
        return 0
        
    days_since_start = (end_date.date() - first_transaction.date.date()).days
    if days_since_start < 1:
        days_since_start = 1
        
    # Use the smaller of requested days or actual history
    effective_days = min(days, days_since_start)
    
    # SMOOTHING: If history is short (likely new user), assume expenses are spread over 
    # the current month's elapsed days to avoid "Day 1 Panic"
    current_day_of_month = end_date.day
    if effective_days < current_day_of_month:
        effective_days = current_day_of_month
        
    if effective_days < 1:
        effective_days = 1
        
    start_date = end_date - datetime.timedelta(days=effective_days)
    
    # Use smart adjusted expenses (excludes transfers/outliers)
    total_expenses = get_adjusted_expenses_sum(user, start_date, end_date)
    
    daily_burn_rate = float(total_expenses) / effective_days
        
    return daily_burn_rate

def predict_runway(user):
    """
    Predicts when the user will run out of budget for the current month.
    Uses 'Wallet Logic' (Cash on Hand) for the starting balance:
    Remaining = Sum(Income Transactions) - Sum(Expense Transactions)
    """
    today = timezone.now()
    current_month = today.month
    current_year = today.year
    
    # 1. Calculate Actual Balance (Wallet Logic)
    # Filter by current month
    start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # We need both Income and Expense totals
    # Note: get_total_expenses_sum already handles expenses
    
    month_txs = Transaction.objects.filter(
        user=user,
        date__year=current_year,
        date__month=current_month
    )
    
    total_income = month_txs.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0
    total_income = float(total_income)
    
    # Use TOTAL expenses (absolute truth)
    # We can reuse get_total_expenses_sum logic or just sum directly here.
    # get_total_expenses_sum filters by DATE RANGE, which is safer if we want exact times.
    total_expenses = get_total_expenses_sum(user, start_of_month, today)
    
    # This is the "Balance Total" from the Wallet Screen
    remaining_budget = total_income - total_expenses
    
    # 2. Calculate Burn Rate (Spending Speed)
    # Use "Smart" logic (IQR) to exclude one-off outliers so the daily rate represents "Typical Day"
    daily_burn_rate = calculate_burn_rate(user, days=60)
    
    # 3. Forecast
    current_day = today.day
    days_in_month = monthrange(current_year, current_month)[1]
    days_left_in_month = days_in_month - current_day
    
    status = "safe"
    forecast_date = None
    message = ""
    
    if remaining_budget <= 0:
        status = "danger"
        message = "Ya has excedido tu presupuesto este mes."
    elif daily_burn_rate <= 0:
        status = "safe"
        message = "No se detectaron gastos recientes para predecir."
    else:
        days_until_zero = remaining_budget / daily_burn_rate
        
        if days_until_zero < days_left_in_month:
            status = "warning"
            # Calculate exact date
            runout_date = today + datetime.timedelta(days=int(days_until_zero))
            forecast_date = runout_date.strftime("%Y-%m-%d")
            message = f"Basado en tus gastos recientes, predecimos que tu presupuesto se acabará el {runout_date.day} de este mes."
        else:
            status = "safe"
            message = "Vas por buen camino. Tu presupuesto debería durar todo el mes."

    return {
        "has_budget": True,
        "disposable_budget": total_income, # Replacing disposable_budget with Actual Income
        "current_expenses": total_expenses,
        "remaining_budget": remaining_budget,
        "daily_burn_rate": daily_burn_rate,
        "status": status, # safe, warning, danger
        "forecast_date": forecast_date,
        "message": message
    }
