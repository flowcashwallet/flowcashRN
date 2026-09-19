from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, BudgetViewSet, CategoryViewSet, VisionEntityViewSet, GamificationStatsViewSet, AnalyticsViewSet, CronViewSet, DevicePushTokenViewSet, PushViewSet, ChatViewSet, BinanceViewSet

router = DefaultRouter()
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budget', BudgetViewSet, basename='budget')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'vision', VisionEntityViewSet, basename='vision')
router.register(r'gamification', GamificationStatsViewSet, basename='gamification')
router.register(r'analytics', AnalyticsViewSet, basename='analytics')
router.register(r'cron', CronViewSet, basename='cron')
router.register(r'push-tokens', DevicePushTokenViewSet, basename='push-token')
router.register(r'push', PushViewSet, basename='push')
router.register(r'chat', ChatViewSet, basename='chat')
router.register(r'binance', BinanceViewSet, basename='binance')

urlpatterns = [
    path('', include(router.urls)),
]
