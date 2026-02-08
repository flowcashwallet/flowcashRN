from django.db import models
from django.contrib.auth.models import User

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('income', 'Income'),
        ('expense', 'Expense'),
        ('transfer', 'Transfer'),
    ]
    
    PAYMENT_TYPES = [
        ('credit_card', 'Credit Card'),
        ('debit_card', 'Debit Card'),
        ('cash', 'Cash'),
        ('transfer', 'Transfer'),
        ('payroll', 'Payroll'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    description = models.CharField(max_length=255)
    category = models.CharField(max_length=100, null=True, blank=True)
    related_entity_id = models.CharField(max_length=255, null=True, blank=True)
    transfer_related_entity_id = models.CharField(max_length=255, null=True, blank=True)
    date = models.DateTimeField()
    payment_type = models.CharField(max_length=20, choices=PAYMENT_TYPES, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.description} - {self.amount}"

class Budget(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='budget')
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_setup = models.BooleanField(default=False)
    last_processed_date = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Budget for {self.user.username}"

class FixedExpense(models.Model):
    budget = models.ForeignKey(Budget, on_delete=models.CASCADE, related_name='fixed_expenses')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.name} - {self.amount}"

class Category(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Categories"

    def __str__(self):
        return f"{self.name} ({self.user.username})"

class Subscription(models.Model):
    FREQUENCY_CHOICES = [
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    name = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    category = models.CharField(max_length=100)
    frequency = models.CharField(max_length=10, choices=FREQUENCY_CHOICES)
    next_payment_date = models.DateTimeField()
    related_entity_id = models.CharField(max_length=255, null=True, blank=True)
    reminder_enabled = models.BooleanField(default=False)
    description = models.CharField(max_length=255, null=True, blank=True)
    icon = models.CharField(max_length=255, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.amount}"

class VisionEntity(models.Model):
    ENTITY_TYPES = [
        ('asset', 'Asset'),
        ('liability', 'Liability'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='vision_entities')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    amount = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    type = models.CharField(max_length=20, choices=ENTITY_TYPES)
    category = models.CharField(max_length=100, null=True, blank=True)
    
    # Crypto
    is_crypto = models.BooleanField(default=False)
    crypto_symbol = models.CharField(max_length=20, null=True, blank=True)
    crypto_amount = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    
    # Credit Card
    is_credit_card = models.BooleanField(default=False)
    cutoff_date = models.IntegerField(null=True, blank=True)
    payment_date = models.IntegerField(null=True, blank=True)
    issuer_bank = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.type})"

class GamificationStats(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='gamification_stats')
    streak_freezes = models.IntegerField(default=3)
    repaired_days = models.JSONField(default=list)
    
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Gamification for {self.user.username}"
