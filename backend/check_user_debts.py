import os
import django
from decimal import Decimal

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from wallet.models import VisionEntity, User

def check_debts():
    users = User.objects.all()
    print(f"Total users found: {users.count()}")
    for u in users:
        print(f"Checking user: {u.username}")
        debts = VisionEntity.objects.filter(user=u, type='liability')
        if debts.exists():
            print(f"\nUser: {u.username}")
            for d in debts:
                print(f"  - {d.name}: Amount={d.amount}, Interest={d.interest_rate}%, MinPay={d.minimum_payment}")
                
            # Run a quick calc for this user with 2000 extra
            from wallet.debt_planner import calculate_payoff_plans
            debt_list = list(debts.values('id', 'name', 'amount', 'interest_rate', 'minimum_payment'))
            plans = calculate_payoff_plans(debt_list, Decimal(2000))
            print(f"  -> Calc with 2000 extra: {plans['snowball']['months_to_payoff']} months")

if __name__ == "__main__":
    check_debts()
