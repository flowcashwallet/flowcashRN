from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("wallet", "0010_binanceconnection"),
    ]

    operations = [
        migrations.AddField(
            model_name="binanceconnection",
            name="last_balances",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
