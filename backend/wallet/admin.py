from django.contrib import admin
from .models import Transaction, Budget, FixedExpense, Category, Subscription, VisionEntity, GamificationStats

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'type', 'category', 'date', 'user')
    list_filter = ('type', 'category', 'date', 'payment_type')
    search_fields = ('description', 'category', 'user__username')
    date_hierarchy = 'date'

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    search_fields = ('name', 'user__username')
    list_filter = ('created_at',)

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('name', 'amount', 'frequency', 'next_payment_date', 'user')
    list_filter = ('frequency', 'next_payment_date')
    search_fields = ('name', 'user__username')

class FixedExpenseInline(admin.TabularInline):
    model = FixedExpense
    extra = 1

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'monthly_income', 'is_setup', 'last_processed_date')
    inlines = [FixedExpenseInline]
    search_fields = ('user__username',)

@admin.register(VisionEntity)
class VisionEntityAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'amount', 'category', 'user')
    list_filter = ('type', 'is_crypto', 'is_credit_card')
    search_fields = ('name', 'user__username')

@admin.register(GamificationStats)
class GamificationStatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'streak_freezes', 'updated_at')
    search_fields = ('user__username',)
