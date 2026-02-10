import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from wallet.models import Transaction

ids = [87, 89, 91, 95]
for t in Transaction.objects.filter(id__in=ids):
    print(f"ID: {t.id}, Type: {t.type}, Entity: {t.related_entity_id}")
