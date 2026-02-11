from decimal import Decimal
from wallet.debt_planner import calculate_payoff_plans

def run_simulation(debts, extra_payment):
    print(f"\n--- Simulation with Extra Payment: {extra_payment} ---")
    plans = calculate_payoff_plans(debts, extra_payment)
    
    print(f"Snowball: {plans['snowball']['months_to_payoff']} months")
    print(f"Avalanche: {plans['avalanche']['months_to_payoff']} months")
    
    # Print first few months of timeline to see what's happening
    print("Timeline first 3 months (Snowball):")
    for m in plans['snowball']['timeline'][:3]:
        print(f"Month {m['month']}: Balance {m['total_balance']}, Paid: {[d['paid'] for d in m['debts']]}")

# Scenario 1: User has large debt
debts_1 = [
    {'id': 1, 'name': 'Card 1', 'amount': 50000, 'interest_rate': 20, 'minimum_payment': 1000},
    {'id': 2, 'name': 'Card 2', 'amount': 50000, 'interest_rate': 20, 'minimum_payment': 1000},
]

# Scenario 2: User has missing minimum payments (defaults to 2%)
debts_2 = [
    {'id': 1, 'name': 'Card 1', 'amount': 50000, 'interest_rate': 50, 'minimum_payment': 0}, # High interest
]

# Scenario 3: Trying to hit ~43 months with 2000 extra
# Maybe total debt is around 150k?
debts_3 = [
    {'id': 1, 'name': 'Big Debt', 'amount': 150000, 'interest_rate': 18, 'minimum_payment': 3000},
]

if __name__ == "__main__":
    # run_simulation(debts_1, 2000)
    # run_simulation(debts_2, 2000)
    run_simulation(debts_3, 2000)
