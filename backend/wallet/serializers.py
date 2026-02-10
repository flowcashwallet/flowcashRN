from rest_framework import serializers
from .models import Transaction, Budget, FixedExpense, Category, Subscription, VisionEntity, GamificationStats

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']
        read_only_fields = ('user', 'created_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class SubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscription
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class VisionEntitySerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(max_digits=15, decimal_places=2, required=False, default=0)

    class Meta:
        model = VisionEntity
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class GamificationStatsSerializer(serializers.ModelSerializer):
    class Meta:
        model = GamificationStats
        fields = ['id', 'streak_freezes', 'repaired_days', 'updated_at']
        read_only_fields = ('user', 'updated_at')

    def create(self, validated_data):
        # Ensure only one stats object per user
        user = self.context['request'].user
        stats, created = GamificationStats.objects.get_or_create(user=user, defaults=validated_data)
        if not created:
             # If exists, just update
            for attr, value in validated_data.items():
                setattr(stats, attr, value)
            stats.save()
        return stats

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('user', 'created_at', 'updated_at')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

class FixedExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = FixedExpense
        fields = ['id', 'name', 'amount', 'category']

class BudgetSerializer(serializers.ModelSerializer):
    fixed_expenses = FixedExpenseSerializer(many=True)

    class Meta:
        model = Budget
        fields = ['id', 'monthly_income', 'is_setup', 'last_processed_date', 'fixed_expenses']
        read_only_fields = ('user', 'created_at', 'updated_at')

    def create(self, validated_data):
        fixed_expenses_data = validated_data.pop('fixed_expenses', [])
        budget, created = Budget.objects.get_or_create(user=self.context['request'].user, defaults=validated_data)
        
        if not created:
            # If it already existed, update fields
            budget.monthly_income = validated_data.get('monthly_income', budget.monthly_income)
            budget.is_setup = validated_data.get('is_setup', budget.is_setup)
            budget.last_processed_date = validated_data.get('last_processed_date', budget.last_processed_date)
            budget.save()
        
        # Handle fixed expenses
        # Strategy: Replace all
        budget.fixed_expenses.all().delete()
        for expense_data in fixed_expenses_data:
            FixedExpense.objects.create(budget=budget, **expense_data)
        
        return budget

    def update(self, instance, validated_data):
        fixed_expenses_data = validated_data.pop('fixed_expenses', None)
        instance.monthly_income = validated_data.get('monthly_income', instance.monthly_income)
        instance.is_setup = validated_data.get('is_setup', instance.is_setup)
        instance.last_processed_date = validated_data.get('last_processed_date', instance.last_processed_date)
        instance.save()

        if fixed_expenses_data is not None:
            instance.fixed_expenses.all().delete()
            for expense_data in fixed_expenses_data:
                FixedExpense.objects.create(budget=instance, **expense_data)
        
        return instance
