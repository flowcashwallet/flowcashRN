from django.db import migrations, models
import django.core.validators


class Migration(migrations.Migration):
    dependencies = [
        ("wallet", "0006_add_recurrence_delete_subscription"),
    ]

    operations = [
        migrations.AddField(
            model_name="transaction",
            name="recurrence_months",
            field=models.IntegerField(
                blank=True,
                help_text="Duration of the recurrence in months (1-36). Null means indefinite.",
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(1),
                    django.core.validators.MaxValueValidator(36),
                ],
            ),
        ),
    ]

