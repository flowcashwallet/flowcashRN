from wallet.models import Transaction, Budget
from django.contrib.auth import get_user_model
from wallet.analytics import predict_runway

u = get_user_model().objects.get(username='debug_user_real_data')
Budget.objects.update_or_create(user=u, defaults={'monthly_income': 60000})
print(f"Runway: {predict_runway(u)}")
