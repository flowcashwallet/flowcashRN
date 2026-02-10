import datetime
from django.utils import timezone
from django.db.models import Sum, Q
from calendar import monthrange
from .models import Transaction, Budget, FixedExpense

def calculate_burn_rate(user, days=180):
    """
    Calculates the average daily variable expense (burn rate) over the last N days.
    Adjusts N if the user's history is shorter than N days.
    """
    end_date = timezone.now()
    
    # Check first transaction date (ANY type) to adjust 'days' if history is short
    # This establishes the true "Account Age"
    first_transaction = Transaction.objects.filter(user=user).order_by('date').first()
    
    if not first_transaction:
        return 0
        
    days_since_start = (end_date.date() - first_transaction.date.date()).days
    if days_since_start < 1:
        days_since_start = 1
        
    # Use the smaller of requested days or actual history
    effective_days = min(days, days_since_start)
    
    # SMOOTHING: If history is short (likely new user), assume expenses are spread over 
    # the current month's elapsed days to avoid "Day 1 Panic" (e.g. spending 30k on Day 1 != 30k/day forever)
    # Only apply if we are predicting within a monthly context (which we are)
    current_day_of_month = end_date.day
    if effective_days < current_day_of_month:
        effective_days = current_day_of_month
        
    if effective_days < 1:
        effective_days = 1
        
    start_date = end_date - datetime.timedelta(days=effective_days)
    
    # Filter expenses in the effective period
    # EXCLUDE transfers disguised as expenses (e.g., category='Transferencia')
    total_expenses = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[start_date, end_date]
    ).exclude(
        Q(category__icontains='transferencia') | 
        Q(category__icontains='transfer') |
        Q(description__icontains='transferencia')
    ).aggregate(Sum('amount'))['amount__sum'] or 0
    
    daily_burn_rate = float(total_expenses) / effective_days
    return daily_burn_rate

def predict_runway(user):
    """
    Predicts when the user will run out of budget for the current month.
    """
    today = timezone.now()
    current_month = today.month
    current_year = today.year
    
    # 1. Get Total Disposable Budget for the Month
    try:
        budget = Budget.objects.get(user=user)
        monthly_income = float(budget.monthly_income)
        
        fixed_expenses = FixedExpense.objects.filter(budget=budget).aggregate(Sum('amount'))['amount__sum'] or 0
        fixed_expenses = float(fixed_expenses)
        
        disposable_budget = monthly_income - fixed_expenses
    except Budget.DoesNotExist:
        return {
            "error": "Budget not set up",
            "has_budget": False
        }

    # 2. Get Current Month Expenses (Variable)
    # EXCLUDE transfers disguised as expenses
    current_month_expenses = Transaction.objects.filter(
        user=user,
        type='expense',
        date__year=current_year,
        date__month=current_month
    ).exclude(
        Q(category__icontains='transferencia') | 
        Q(category__icontains='transfer') |
        Q(description__icontains='transferencia')
    ).aggregate(Sum('amount'))['amount__sum'] or 0
    current_month_expenses = float(current_month_expenses)
    
    remaining_budget = disposable_budget - current_month_expenses
    
    # 3. Calculate Burn Rate (Spending Speed)
    # Use last 2 months (60 days) for a more precise recent trend
    daily_burn_rate = calculate_burn_rate(user, days=60)
    
    # 4. Forecast
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
        "disposable_budget": disposable_budget,
        "current_expenses": current_month_expenses,
        "remaining_budget": remaining_budget,
        "daily_burn_rate": daily_burn_rate,
        "status": status, # safe, warning, danger
        "forecast_date": forecast_date,
        "message": message
    }
