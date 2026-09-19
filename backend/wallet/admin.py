from django.contrib import admin
from admin_auto_filters.filters import AutocompleteFilter
from .models import Transaction, Budget, FixedExpense, Category, VisionEntity, GamificationStats, BinanceConnection

class UserFilter(AutocompleteFilter):
    title = 'User'
    field_name = 'user'

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('description', 'amount', 'type', 'category', 'date', 'user')
    list_filter = ('type', 'category', 'date', 'payment_type', UserFilter)
    search_fields = ('description', 'category', 'user__username')
    date_hierarchy = 'date'
    autocomplete_fields = ['user']

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'user', 'created_at')
    search_fields = ('name', 'user__username')
    list_filter = ('created_at', UserFilter)
    autocomplete_fields = ['user']

class FixedExpenseInline(admin.TabularInline):
    model = FixedExpense
    extra = 1

@admin.register(Budget)
class BudgetAdmin(admin.ModelAdmin):
    list_display = ('user', 'monthly_income', 'is_setup', 'last_processed_date')
    list_filter = (UserFilter, 'is_setup')
    inlines = [FixedExpenseInline]
    search_fields = ('user__username',)
    autocomplete_fields = ['user']

@admin.register(VisionEntity)
class VisionEntityAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'amount', 'category', 'user')
    list_filter = ('type', 'is_crypto', 'is_credit_card', UserFilter)
    search_fields = ('name', 'user__username')
    autocomplete_fields = ['user']

@admin.register(BinanceConnection)
class BinanceConnectionAdmin(admin.ModelAdmin):
    # The encrypted secret/key fields are never shown here, not even to a
    # superuser — reduces the blast radius of a compromised admin session.
    # There's no "reveal" action either; decrypting is only ever done
    # in-memory inside the sync flow (binance_client.py via views.py).
    list_display = ('user', 'masked_key_preview', 'is_read_only_confirmed', 'last_synced_at')
    list_filter = ('is_read_only_confirmed', UserFilter)
    search_fields = ('user__username', 'masked_key_preview')
    autocomplete_fields = ['user']
    readonly_fields = ('masked_key_preview', 'is_read_only_confirmed', 'permissions_checked_at', 'last_synced_at', 'created_at', 'updated_at')
    exclude = ('api_key_encrypted', 'api_secret_encrypted')

@admin.register(GamificationStats)
class GamificationStatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'streak_freezes', 'updated_at')
    list_filter = (UserFilter,)
    search_fields = ('user__username',)
    autocomplete_fields = ['user']
