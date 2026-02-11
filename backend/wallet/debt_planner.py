from decimal import Decimal
from datetime import date, timedelta
import copy

def calculate_payoff_plans(debts, extra_payment_monthly):
    """
    Calculates debt payoff plans using Snowball and Avalanche methods.
    
    Args:
        debts (list): List of dicts containing:
            - id: int/str
            - name: str
            - amount: Decimal (current balance)
            - interest_rate: Decimal (annual %)
            - minimum_payment: Decimal
        extra_payment_monthly (Decimal): Amount available above sum of minimums.
        
    Returns:
        dict: {
            'snowball': { ... },
            'avalanche': { ... }
        }
    """
    # Convert all inputs to Decimal to be safe
    clean_debts = []
    
    for d in debts:
        amount = Decimal(str(d['amount']))
        rate = Decimal(str(d.get('interest_rate') or 0))
        min_pay = Decimal(str(d.get('minimum_payment') or 0))
        
        # Heuristic: If min_payment is missing, assume 2% of balance or $10
        if min_pay == 0 and amount > 0:
            min_pay = max(Decimal('10.00'), amount * Decimal('0.02'))
            
        clean_debts.append({
            'id': d.get('id'),
            'name': d.get('name'),
            'amount': amount,
            'interest_rate': rate,
            'minimum_payment': min_pay
        })
        
    extra = Decimal(str(extra_payment_monthly))
    
    return {
        'snowball': _simulate_strategy(clean_debts, extra, 'snowball'),
        'avalanche': _simulate_strategy(clean_debts, extra, 'avalanche')
    }

def _simulate_strategy(original_debts, extra_payment, strategy):
    # Deep copy to not mess up between runs
    debts = copy.deepcopy(original_debts)
    
    # Calculate Total Budget (Constant throughout the plan)
    # The "Snowball" effect relies on keeping the payment amount constant 
    # even as debts disappear.
    total_min_payments = sum(d['minimum_payment'] for d in debts)
    monthly_budget = total_min_payments + extra_payment
    
    # Sort
    if strategy == 'snowball':
        # Lowest Balance First
        debts.sort(key=lambda x: x['amount'])
    elif strategy == 'avalanche':
        # Highest Interest Rate First
        debts.sort(key=lambda x: x['interest_rate'], reverse=True)
        
    months = 0
    total_interest = Decimal('0.00')
    timeline = []
    
    # Limit to 30 years to prevent infinite loops
    while any(d['amount'] > 0.01 for d in debts) and months < 360:
        months += 1
        month_interest = Decimal('0.00')
        remaining_budget = monthly_budget
        
        month_log = {
            'month': months,
            'debts': [],
            'total_balance': Decimal('0.00')
        }
        
        # 1. Accrue Interest
        for d in debts:
            if d['amount'] > 0:
                # Monthly rate = Annual / 12 / 100
                interest = d['amount'] * (d['interest_rate'] / Decimal('100') / Decimal('12'))
                d['amount'] += interest
                d['accrued_interest'] = interest
                month_interest += interest
                total_interest += interest
            else:
                d['accrued_interest'] = Decimal('0.00')
                
        # 2. Pay Minimums
        for d in debts:
            if d['amount'] > 0:
                # Pay min or full balance
                payment = min(d['minimum_payment'], d['amount'])
                
                # Check budget
                if remaining_budget < payment:
                    payment = remaining_budget # Should not happen if budget >= mins
                    
                d['amount'] -= payment
                d['paid_this_month'] = payment
                remaining_budget -= payment
            else:
                d['paid_this_month'] = Decimal('0.00')
                
        # 3. Pay Extra (Snowball/Avalanche Target)
        if remaining_budget > 0:
            # Find first active debt in sorted list
            for d in debts:
                if d['amount'] > 0:
                    payment = min(remaining_budget, d['amount'])
                    d['amount'] -= payment
                    d['paid_this_month'] += payment
                    remaining_budget -= payment
                    
                    if remaining_budget <= 0:
                        break
        
        # Log state
        current_total_balance = Decimal('0.00')
        for d in debts:
            current_total_balance += d['amount']
            month_log['debts'].append({
                'name': d['name'],
                'balance': float(round(d['amount'], 2)),
                'paid': float(round(d['paid_this_month'], 2))
            })
        
        month_log['total_balance'] = float(round(current_total_balance, 2))
        timeline.append(month_log)
        
    return {
        'months_to_payoff': months,
        'total_interest_paid': float(round(total_interest, 2)),
        'payoff_date': (date.today() + timedelta(days=30*months)).isoformat(),
        'timeline': timeline
    }
