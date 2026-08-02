import datetime
from django.utils import timezone
try:
    import zoneinfo
except ImportError:
    from backports import zoneinfo
from django.db.models import Sum, Q
from calendar import monthrange
from .models import Transaction, Budget, FixedExpense

def get_exclusion_filter():
    return (
        Q(type='transfer')
    )


def _normalize_text(value):
    """Lowercase and strip whitespace for loose comparison."""
    if not value:
        return ''
    return str(value).strip().lower()


def get_fixed_expense_signatures(user):
    """
    Returns fixed-expense signatures from the user's budget and from
    explicit recurring transactions.

    A "signature" is a (description, category, amount) tuple that identifies
    predictable, recurring spending. We use it instead of category-only
    matching because a category like 'Housing' could also include one-off
    repairs, while a FixedExpense called 'Rent' with the same amount every
    month should be excluded from variable spending analysis.
    """
    signatures = set()

    # 1. Fixed expenses from the budget module
    try:
        budget = user.budget
    except Exception:
        budget = None

    if budget:
        for fe in budget.fixed_expenses.all():
            signatures.add((
                _normalize_text(fe.name),
                _normalize_text(fe.category),
                float(fe.amount),
            ))

    # 2. Explicit recurring transactions (the parent templates)
    recurring = Transaction.objects.filter(
        user=user,
        type='expense',
        is_recurring=True,
    ).values('description', 'category', 'amount')

    for tx in recurring:
        signatures.add((
            _normalize_text(tx['description']),
            _normalize_text(tx['category']),
            float(tx['amount']),
        ))

    return signatures


def _build_recurring_frequency_map(user, start_date, end_date):
    """
    Build a frequency map of (description, category, amount) occurrences
    over the given date range. Used to detect de-facto recurring expenses
    without relying on explicit recurring flags.

    Returns a dict: {(description, category, amount): count}
    """
    transactions = Transaction.objects.filter(
        user=user,
        type='expense',
        date__range=[start_date, end_date],
    ).values('description', 'category', 'amount')

    frequency = {}
    for tx in transactions:
        key = (
            _normalize_text(tx['description']),
            _normalize_text(tx['category']),
            float(tx['amount'] or 0),
        )
        frequency[key] = frequency.get(key, 0) + 1

    return frequency


def _is_fixed_like_expense(
    tx,
    fixed_signatures,
    recurring_frequency,
    min_recurring_occurrences=3,
):
    """
    Decide whether a transaction looks like a fixed/recurring expense.

    Matching logic (in order of strictness):
      1. The transaction itself is recurring.
      2. Exact signature match: same normalized description + category + amount
         against a budget FixedExpense or an explicit recurring transaction.
      3. De-facto recurrence: same description + category + amount appears at
         least `min_recurring_occurrences` times in the period.
      4. Amount + category match against a budget FixedExpense, but only if
         that (category, amount) pair appears multiple times (prevents a
         one-off purchase from being treated as fixed just because it shares
         price and category).
    """
    if tx.get('is_recurring'):
        return True

    tx_desc = _normalize_text(tx.get('description'))
    tx_cat = _normalize_text(tx.get('category'))
    tx_amount = float(tx.get('amount') or 0)

    exact_key = (tx_desc, tx_cat, tx_amount)
    cat_amount_key = (tx_cat, tx_amount)

    # Collect budget-only signatures separately for the frequency-guarded rule
    budget_cat_amount_signatures = {
        (_normalize_text(fe.category), float(fe.amount))
        for _, cat, amount in fixed_signatures
    }

    # Count how many times this (category, amount) pair appears in the period.
    # We iterate the frequency map once to build this helper.
    cat_amount_frequency = {}
    for desc, cat, amount in recurring_frequency:
        key = (cat, amount)
        cat_amount_frequency[key] = cat_amount_frequency.get(key, 0) + recurring_frequency[(desc, cat, amount)]

    # 1. Exact signature match (budget or explicit recurring)
    if exact_key in fixed_signatures:
        return True

    # 2. De-facto recurrence: appears multiple times with identical metadata
    if recurring_frequency.get(exact_key, 0) >= min_recurring_occurrences:
        return True

    # 3. Budget-defined (category, amount) only if it repeats in reality
    if cat_amount_key in budget_cat_amount_signatures:
        if cat_amount_frequency.get(cat_amount_key, 0) >= min_recurring_occurrences:
            return True

    return False


def _percentile(values, p):
    """
    Linear-interpolation percentile (Excel / NumPy default method).
    p must be between 0 and 100.
    """
    if not values:
        return 0.0
    sorted_values = sorted(values)
    n = len(sorted_values)
    if n == 1:
        return float(sorted_values[0])

    # Rank with linear interpolation between closest ranks
    rank = (p / 100.0) * (n - 1)
    lower = int(rank)
    upper = min(lower + 1, n - 1)
    weight = rank - lower

    return sorted_values[lower] * (1 - weight) + sorted_values[upper] * weight

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
    Returns the total VARIABLE sum of expenses for a period, excluding:
    1. Explicit transfers/keywords
    2. Fixed/recurring expenses (predictable, already budgeted separately)
    3. Statistical outliers (IQR method) like one-time emergencies or trips

    Used for 'What is my typical spending speed?' (Trend Analysis).
    """
    exclusion_filter = get_exclusion_filter()
    fixed_signatures = get_fixed_expense_signatures(user)
    recurring_frequency = _build_recurring_frequency_map(user, start_date, end_date)

    transactions = list(
        Transaction.objects.filter(
            user=user,
            type='expense',
            date__range=[start_date, end_date]
        )
        .exclude(exclusion_filter)
        .values('amount', 'date', 'description', 'category', 'is_recurring')
    )

    if not transactions:
        return 0.0

    # Remove fixed/recurring-like expenses first
    variable_amounts = []
    for tx in transactions:
        if _is_fixed_like_expense(tx, fixed_signatures, recurring_frequency):
            continue
        variable_amounts.append(float(tx['amount']))

    if not variable_amounts:
        return 0.0

    # --- Outlier detection at transaction level --------------------------
    # One-time big expenses (emergency, travel, etc.) should not skew the
    # daily average. Use a conservative upper fence (3.0 * IQR).
    cleaned_amounts = variable_amounts
    if len(variable_amounts) >= 5:
        q1 = _percentile(variable_amounts, 25)
        q3 = _percentile(variable_amounts, 75)
        iqr = q3 - q1
        upper_fence = q3 + (3.0 * iqr)
        cleaned_amounts = [a for a in variable_amounts if a <= upper_fence]

    # Group by day
    daily_totals = {}
    for tx, amount in zip(transactions, variable_amounts):
        if amount not in cleaned_amounts:
            continue
        date_key = tx['date'].date()
        daily_totals[date_key] = daily_totals.get(date_key, 0) + amount

    daily_values = list(daily_totals.values())

    # --- Secondary daily-level outlier filter ----------------------------
    # A day where multiple "normal" expenses coincided can still be atypical.
    if len(daily_values) >= 5:
        q1 = _percentile(daily_values, 25)
        q3 = _percentile(daily_values, 75)
        iqr = q3 - q1
        upper_fence = q3 + (3.0 * iqr)
        cleaned_values = [v for v in daily_values if v <= upper_fence]
        return sum(cleaned_values)

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
    
    # Use smart adjusted expenses (excludes transfers, fixed expenses and outliers)
    total_expenses = get_adjusted_expenses_sum(user, start_date, end_date)

    daily_burn_rate = float(total_expenses) / effective_days

    return daily_burn_rate

def calculate_forecast_confidence(user):
    """
    Estimates how reliable the forecast is based on the user's history.

    Confidence levels:
        high   - >= 45 days of history and >= 20 expense days
        medium - >= 14 days of history and >= 5 expense days
        low    - insufficient data
    """
    end_date = timezone.now()
    first_transaction = Transaction.objects.filter(user=user).order_by('date').first()

    if not first_transaction:
        return {"level": "low", "history_days": 0, "expense_days": 0}

    history_days = (end_date.date() - first_transaction.date.date()).days
    if history_days < 1:
        history_days = 1

    cutoff = end_date - datetime.timedelta(days=60)
    expense_days = (
        Transaction.objects.filter(
            user=user,
            type='expense',
            date__gte=cutoff,
        )
        .exclude(get_exclusion_filter())
        .dates('date', 'day')
        .count()
    )

    if history_days >= 45 and expense_days >= 20:
        level = "high"
    elif history_days >= 14 and expense_days >= 5:
        level = "medium"
    else:
        level = "low"

    return {"level": level, "history_days": history_days, "expense_days": expense_days}


def calculate_effective_burn_rate(user):
    """
    Combines multiple burn-rate windows and applies a momentum bias.

    - If recent (7d) spending is meaningfully higher than the medium-term
      (60d) trend, we bias the projection upward (recent behavior matters).
    - If recent spending is lower, we keep the medium-term rate to avoid
      over-optimism from a quiet week.

    Returns a dict with the effective rate plus the raw components so the
    caller can expose them in the API.
    """
    burn_rate_7d = calculate_burn_rate(user, days=7)
    burn_rate_30d = calculate_burn_rate(user, days=30)
    burn_rate_60d = calculate_burn_rate(user, days=60)

    effective_rate = burn_rate_60d
    trend = "stable"

    if burn_rate_60d > 0:
        delta_ratio = (burn_rate_7d - burn_rate_60d) / burn_rate_60d
        if delta_ratio > 0.15:
            # Recent spending is accelerating; weight it more heavily.
            effective_rate = 0.6 * burn_rate_7d + 0.4 * burn_rate_60d
            trend = "accelerating"
        elif delta_ratio < -0.15:
            # Recent spending is decelerating, but stay conservative.
            effective_rate = 0.7 * burn_rate_60d + 0.3 * burn_rate_30d
            trend = "decelerating"
    else:
        # No medium-term history; fall back to the widest available window.
        effective_rate = burn_rate_30d or burn_rate_7d

    return {
        "effective_rate": effective_rate,
        "burn_rate_7d": burn_rate_7d,
        "burn_rate_30d": burn_rate_30d,
        "burn_rate_60d": burn_rate_60d,
        "trend": trend,
    }


def predict_runway(user):
    """
    Predicts when the user will run out of budget for the current month.

    Uses 'Wallet Logic' (Cash on Hand):
        current_remaining = Sum(Income) - Sum(Expenses) for the current month.

    The projection excludes today's already-recorded transactions so the
    frontend can mix in today's live data independently:
        remaining_excluding_today = current_remaining - today_income + today_expenses

    CRITICAL: Respects User Timezone (Default: Mexico City) to match Frontend.
    """
    # 1. Timezone and month boundaries
    user_tz = zoneinfo.ZoneInfo("America/Mexico_City")
    now_utc = timezone.now()
    now_local = now_utc.astimezone(user_tz)

    current_year = now_local.year
    current_month = now_local.month

    start_of_month_local = now_local.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    if current_month == 12:
        start_of_next_month_local = start_of_month_local.replace(year=current_year + 1, month=1)
    else:
        start_of_next_month_local = start_of_month_local.replace(month=current_month + 1)

    start_utc = start_of_month_local.astimezone(datetime.timezone.utc)
    end_utc = start_of_next_month_local.astimezone(datetime.timezone.utc)

    # 2. Current month transactions
    month_txs = Transaction.objects.filter(
        user=user,
        date__gte=start_utc,
        date__lt=end_utc,
    )

    total_income = float(month_txs.filter(type='income').aggregate(Sum('amount'))['amount__sum'] or 0)
    total_outflow = float(month_txs.filter(type='expense').aggregate(Sum('amount'))['amount__sum'] or 0)

    current_remaining = total_income - total_outflow

    # 3. Today's transactions
    start_of_today_local = now_local.replace(hour=0, minute=0, second=0, microsecond=0)
    start_of_tomorrow_local = start_of_today_local + datetime.timedelta(days=1)
    start_today_utc = start_of_today_local.astimezone(datetime.timezone.utc)
    end_today_utc = start_of_tomorrow_local.astimezone(datetime.timezone.utc)

    today_income = float(
        month_txs.filter(type='income', date__gte=start_today_utc, date__lt=end_today_utc)
        .aggregate(Sum('amount'))['amount__sum'] or 0
    )
    today_outflow = float(
        month_txs.filter(type='expense', date__gte=start_today_utc, date__lt=end_today_utc)
        .aggregate(Sum('amount'))['amount__sum'] or 0
    )

    today_net = today_income - today_outflow

    # 4. Burn rate, confidence and time windows
    burn_rate_info = calculate_effective_burn_rate(user)
    confidence_info = calculate_forecast_confidence(user)
    daily_burn_rate = burn_rate_info["effective_rate"]
    spending_trend = burn_rate_info["trend"]
    confidence = confidence_info["level"]

    current_day = now_local.day
    days_in_month = monthrange(current_year, current_month)[1]
    days_after_today = days_in_month - current_day
    days_left_including_today = days_after_today + 1

    # Projection base: money left for days after today
    remaining_excluding_today = current_remaining - today_net

    # --- Improved daily allowance -----------------------------------------
    # Use the configured budget to reserve committed fixed expenses that
    # haven't been paid yet, so the daily number stops being just
    # "income minus expenses ÷ days".
    try:
        budget = user.budget
    except Exception:
        budget = None

    fixed_total = 0.0
    fixed_paid = 0.0
    if budget:
        fixed_total = float(
            budget.fixed_expenses.aggregate(Sum("amount"))["amount__sum"] or 0
        )
        fixed_categories = [
            c
            for c in budget.fixed_expenses.values_list("category", flat=True).distinct()
            if c
        ]
        if fixed_categories:
            fixed_paid = float(
                month_txs.filter(
                    type="expense", category__in=fixed_categories
                ).aggregate(Sum("amount"))["amount__sum"] or 0
            )

    unpaid_fixed = max(0.0, fixed_total - fixed_paid)
    spendable_remaining = current_remaining - unpaid_fixed

    # Daily allowance: equal share of the money actually free to spend
    # after reserving the fixed expenses that are still due this month.
    daily_allowance = (
        spendable_remaining / days_left_including_today
        if days_left_including_today > 0
        else 0.0
    )
    daily_allowance = max(0.0, daily_allowance)

    # 5. Projected balance at end of month
    projected_spending_rest_of_month = daily_burn_rate * days_after_today
    projected_balance = remaining_excluding_today - projected_spending_rest_of_month

    # 6. Compare with last month up to the same day
    previous_month = current_month - 1 if current_month > 1 else 12
    previous_year = current_year if current_month > 1 else current_year - 1
    start_of_prev_month_local = now_local.replace(
        year=previous_year, month=previous_month, day=1, hour=0, minute=0, second=0, microsecond=0
    )
    prev_month_same_day_local = start_of_prev_month_local + datetime.timedelta(days=current_day)
    start_prev_utc = start_of_prev_month_local.astimezone(datetime.timezone.utc)
    end_prev_utc = prev_month_same_day_local.astimezone(datetime.timezone.utc)

    last_month_outflow = float(
        Transaction.objects.filter(
            user=user,
            type='expense',
            date__gte=start_prev_utc,
            date__lt=end_prev_utc,
        )
        .exclude(get_exclusion_filter())
        .aggregate(Sum('amount'))['amount__sum'] or 0
    )

    spending_change_vs_last_month = None
    if last_month_outflow > 0:
        spending_change_vs_last_month = (total_outflow - last_month_outflow) / last_month_outflow

    # 7. Status, weather and tips
    status = "safe"
    forecast_date = None
    message = ""
    tip = ""

    if current_remaining <= 0:
        weather_status = "stormy"
        weather_message = "Tormenta financiera. Has excedido tus ingresos del mes."
        status = "danger"
        message = "Ya has excedido tu presupuesto este mes."
        tip = "Tip: Intenta limitar tus gastos a lo esencial hasta el próximo mes."
    elif daily_burn_rate <= 0:
        weather_status = "sunny"
        weather_message = "Cielo despejado. Tus finanzas se ven saludables."
        status = "safe"
        message = "No se detectaron gastos recientes para predecir."
        projected_balance = remaining_excluding_today
    else:
        # Financial weather
        if projected_balance < 0:
            weather_status = "cloudy"
            weather_message = "Se avecinan nubes. A este ritmo, terminarás el mes en negativo."
        elif projected_balance < (total_income * 0.1):
            weather_status = "cloudy"
            weather_message = "Cielo parcialmente nublado. Margen de ahorro bajo."
        else:
            weather_status = "sunny"
            weather_message = "Cielo despejado. Tus finanzas se ven saludables."

        # Runway logic
        days_until_zero = remaining_excluding_today / daily_burn_rate

        if days_until_zero < days_after_today:
            status = "warning"
            runout_date = now_local + datetime.timedelta(days=int(days_until_zero))
            forecast_date = runout_date.strftime("%Y-%m-%d")
            message = (
                f"Basado en tus gastos recientes, predecimos que tu presupuesto "
                f"se acabará el {runout_date.day} de este mes."
            )

            if days_after_today > 0:
                safe_daily = daily_allowance
                reduction_needed = max(0.0, daily_burn_rate - safe_daily)
                tip = (
                    f"Tip: Para llegar a fin de mes, mantén tu gasto diario alrededor de "
                    f"${safe_daily:,.2f}/día. Estás gastando ${reduction_needed:,.2f} más de lo recomendado."
                )
        else:
            status = "safe"
            message = "Vas por buen camino. Tu presupuesto debería durar todo el mes."

            potential_savings_10_percent = projected_spending_rest_of_month * 0.10
            final_with_reduction = projected_balance + potential_savings_10_percent
            tip = (
                f"Tip: Tu presupuesto diario disponible es ~${daily_allowance:,.2f}/día "
                f"(después de reservar ${unpaid_fixed:,.2f} en gastos fijos). "
                f"Si reduces tu gasto diario un 10%, podrías terminar el mes "
                f"con un extra de ${final_with_reduction:,.2f}."
            )

    # Append month-over-month comparison when available.
    if spending_change_vs_last_month is not None:
        change_pct = abs(spending_change_vs_last_month) * 100
        direction = "más" if spending_change_vs_last_month > 0 else "menos"
        comparison_tip = (
            f"Llevas un {change_pct:.0f}% {direction} gastado que el mes pasado a esta fecha."
        )
        tip = f"{tip} {comparison_tip}" if tip else comparison_tip

    return {
        "has_budget": True,
        "disposable_budget": total_income,
        "current_expenses": total_outflow,
        "current_remaining": current_remaining,
        "remaining_budget": current_remaining,
        "remaining_excluding_today": remaining_excluding_today,
        "daily_burn_rate": daily_burn_rate,
        "daily_burn_rate_7d": burn_rate_info["burn_rate_7d"],
        "daily_burn_rate_30d": burn_rate_info["burn_rate_30d"],
        "daily_burn_rate_60d": burn_rate_info["burn_rate_60d"],
        "spending_trend": spending_trend,
        "confidence": confidence,
        "confidence_history_days": confidence_info["history_days"],
        "confidence_expense_days": confidence_info["expense_days"],
        "daily_allowance": daily_allowance,
        "fixed_expenses_total": fixed_total,
        "fixed_expenses_paid": fixed_paid,
        "unpaid_fixed": unpaid_fixed,
        "status": status,
        "forecast_date": forecast_date,
        "message": message,
        "projected_balance": projected_balance,
        "tip": tip,
        "today_income": today_income,
        "today_expenses": today_outflow,
        "days_left_including_today": days_left_including_today,
        "weather_status": weather_status,
        "weather_message": weather_message,
        "spending_change_vs_last_month": spending_change_vs_last_month,
    }
