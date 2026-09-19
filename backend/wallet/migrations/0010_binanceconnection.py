from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):
    dependencies = [
        ("wallet", "0009_category"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="BinanceConnection",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("api_key_encrypted", models.TextField()),
                ("api_secret_encrypted", models.TextField()),
                ("masked_key_preview", models.CharField(max_length=20)),
                ("is_read_only_confirmed", models.BooleanField(default=False)),
                ("permissions_checked_at", models.DateTimeField(blank=True, null=True)),
                ("last_synced_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="binance_connection", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
