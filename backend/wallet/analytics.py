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
    # Also exclude explicit 'transfer' type if it somehow got included (though type='expense' should filter it)
    # And exclude common payment keywords that are not real spending (credit card payments, etc)
    exclusion_filter = (
        Q(type='transfer') | 
        Q(category__icontains='transfer') | 
        Q(category__icontains='traspaso') |
        Q(category__icontains='spei') |
        Q(category__icontains='tarjeta de credito') |
        Q(category__icontains='credit card') |
        Q(category__icontains='abono') |
        Q(description__icontains='transfer') |
        Q(description__icontains='traspaso') |
        Q(description__icontains='spei')
    )

    # SMART ANALYSIS: Fetch all transactions to perform outlier detection
    # Instead of a simple Sum, we fetch the values to analyze the distribution
    transactions = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[start_date, end_date]
    ).exclude(exclusion_filter).values('amount', 'date')
    
    if not transactions:
        return 0
        
    # Group by day to find daily spend
    daily_totals = {}
    for tx in transactions:
        # Normalize to date (ignore time)
        date_key = tx['date'].date()
        amount = float(tx['amount'])
        daily_totals[date_key] = daily_totals.get(date_key, 0) + amount
        
    # Extract daily values
    daily_values = list(daily_totals.values())
    
    # If we have enough data points (e.g. > 5 days), apply Outlier Detection (IQR)
    # This removes massive spikes (like a 20k transfer labeled as expense) that skew the average
    if len(daily_values) >= 5:
        sorted_values = sorted(daily_values)
        n = len(sorted_values)
        
        # Calculate Q1 and Q3
        q1_index = int(n * 0.25)
        q3_index = int(n * 0.75)
        q1 = sorted_values[q1_index]
        q3 = sorted_values[q3_index]
        
        iqr = q3 - q1
        
        # Upper Fence for Outliers (Extreme Spikes)
        # We use 3.0 * IQR for "Extreme" outliers to be conservative (don't remove high-but-normal days)
        # Or 1.5 * IQR for standard outliers. Given budget context, spikes are usually transfers.
        upper_fence = q3 + (1.5 * iqr)
        
        # Filter out extreme days
        cleaned_values = [v for v in daily_values if v <= upper_fence]
        
        # Recalculate Total from cleaned data
        total_expenses = sum(cleaned_values)
        
        # Adjust effective days? 
        # If we removed days, should we reduce the denominator?
        # No, because we want the "Average Daily Spend" over the PERIOD.
        # If I spent 20k on Day 1 (Outlier) and $100 on Day 2...Day 30.
        # The Outlier means "This doesn't happen usually".
        # So my "Typical Burn Rate" is based on the $100 days.
        # So we keep the denominator as the full period (effective_days) 
        # OR we treat the outlier as $0 spend for that day?
        # Better: We use the Average of the Cleaned Values as the Burn Rate.
        if cleaned_values:
            daily_burn_rate = sum(cleaned_values) / len(cleaned_values)
            # But wait, this assumes we have data for EVERY day.
            # If we only have data for 10 days out of 60.
            # Average of Cleaned Values = Avg Spend ON DAYS I SPEND.
            # But Burn Rate is "Spend per Calendar Day".
            
            # Correct approach:
            # 1. Total Cleaned Expenses / effective_days
            daily_burn_rate = float(total_expenses) / effective_days
        else:
            daily_burn_rate = 0
            
    else:
        # Not enough data for smart analysis, use simple average
        total_expenses = sum(daily_values)
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
    exclusion_filter = (
        Q(type='transfer') | 
        Q(category__icontains='transfer') | 
        Q(category__icontains='traspaso') |
        Q(category__icontains='spei') |
        Q(category__icontains='tarjeta de credito') |
        Q(category__icontains='credit card') |
        Q(category__icontains='abono') |
        Q(description__icontains='transfer') |
        Q(description__icontains='traspaso') |
        Q(description__icontains='spei')
    )

    current_month_expenses = Transaction.objects.filter(
        user=user,
        type='expense',
        date__year=current_year,
        date__month=current_month
    ).exclude(exclusion_filter).aggregate(Sum('amount'))['amount__sum'] or 0
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
