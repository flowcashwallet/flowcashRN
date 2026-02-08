from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, BudgetViewSet, CategoryViewSet, SubscriptionViewSet, VisionEntityViewSet, GamificationStatsViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budget', BudgetViewSet, basename='budget')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'subscriptions', SubscriptionViewSet, basename='subscription')
router.register(r'vision', VisionEntityViewSet, basename='vision')
router.register(r'gamification', GamificationStatsViewSet, basename='gamification')

urlpatterns = [
    path('', include(router.urls)),
]
