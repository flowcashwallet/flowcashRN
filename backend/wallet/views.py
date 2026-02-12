from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from .models import Transaction, Budget, Category, Subscription, VisionEntity, GamificationStats
from .serializers import TransactionSerializer, BudgetSerializer, CategorySerializer, SubscriptionSerializer, VisionEntitySerializer, GamificationStatsSerializer
from .ml import predict_category_for_user
from .nlp import parse_voice_command
from .analytics import predict_runway

class AnalyticsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def forecast(self, request):
        """
        Returns a cash flow forecast (runway prediction) based on historical spending.
        """
        result = predict_runway(request.user)
        return Response(result)

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by('name')
    
    @action(detail=False, methods=['post'], url_path='predict')
    def predict(self, request):
        """
        Endpoint to predict category based on description.
        Body: { "description": "Starbucks" }
        """
        description = request.data.get('description', '')
        if not description:
            return Response({"error": "Description is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        predicted_category = predict_category_for_user(request.user, description)
        
        return Response({
            "description": description,
            "predicted_category": predicted_category
        })
    
    @action(detail=False, methods=['post'])
    def batch_create(self, request):
        # We need to manually inject the user into the data for validation if using many=True
        # Or we can just iterate and save.
        
        # A simpler way for batch creation where we need to assign user:
        data = request.data
        if not isinstance(data, list):
            return Response({"detail": "Expected a list of items"}, status=status.HTTP_400_BAD_REQUEST)
        
        created_categories = []
        for item in data:
            serializer = self.get_serializer(data=item)
            if serializer.is_valid():
                serializer.save(user=request.user)
                created_categories.append(serializer.data)
            # We skip invalid ones or could raise error
            
        return Response(created_categories, status=status.HTTP_201_CREATED)

class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Subscription.objects.filter(user=self.request.user).order_by('next_payment_date')

class VisionEntityViewSet(viewsets.ModelViewSet):
    serializer_class = VisionEntitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return VisionEntity.objects.filter(user=self.request.user).order_by('-amount')

    @action(detail=False, methods=['get'], url_path='debt-plan')
    def debt_plan(self, request):
        """
        Calculates debt payoff plan for user's liabilities.
        Query Params: extra_payment (default 0)
        """
        try:
            extra_payment = Decimal(request.query_params.get('extra_payment', 0))
        except:
            extra_payment = Decimal(0)
            
        # Fetch liabilities
        liabilities = VisionEntity.objects.filter(
            user=request.user, 
            type='liability'
        ).values('id', 'name', 'amount', 'interest_rate', 'minimum_payment')
        
        # Calculate
        from .debt_planner import calculate_payoff_plans
        plans = calculate_payoff_plans(list(liabilities), extra_payment)
        
        return Response(plans)

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        """
        Exports filtered Vision entities to Excel.
        """
        queryset = self.filter_queryset(self.get_queryset())
        from .exporters import export_vision_to_excel
        return export_vision_to_excel(queryset)

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        """
        Exports filtered Vision entities to PDF.
        """
        queryset = self.filter_queryset(self.get_queryset())
        from .exporters import export_vision_to_pdf
        return export_vision_to_pdf(queryset)

class GamificationStatsViewSet(viewsets.ModelViewSet):
    serializer_class = GamificationStatsSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return GamificationStats.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'post', 'put', 'patch'], url_path='current')
    def current(self, request):
        stats, created = GamificationStats.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(stats)
            return Response(serializer.data)
        
        elif request.method in ['POST', 'PUT', 'PATCH']:
            serializer = self.get_serializer(stats, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    @action(detail=False, methods=['get'], url_path='export/excel')
    def export_excel(self, request):
        """
        Exports filtered transactions to Excel.
        Supports standard list filters (date, category, etc.)
        """
        queryset = self.filter_queryset(self.get_queryset())
        from .exporters import export_transactions_to_excel
        return export_transactions_to_excel(queryset)

    @action(detail=False, methods=['get'], url_path='export/pdf')
    def export_pdf(self, request):
        """
        Exports filtered transactions to PDF.
        Supports standard list filters.
        """
        queryset = self.filter_queryset(self.get_queryset())
        from .exporters import export_transactions_to_pdf
        return export_transactions_to_pdf(queryset)

    @action(detail=False, methods=['post'], url_path='parse-command')
    def parse_command(self, request):
        """
        Parses a natural language voice command into structured transaction data.
        Body: { "text": "Gasté 500 en Oxxo" }
        """
        text = request.data.get('text', '')
        if not text:
            return Response({"error": "Text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            result = parse_voice_command(text, request.user)
            return Response(result)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    @action(detail=False, methods=['get', 'post', 'put', 'patch', 'delete'], url_path='current')
    def current(self, request):
        # Get or create the budget for the user
        budget, created = Budget.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = self.get_serializer(budget)
            return Response(serializer.data)
        
        elif request.method in ['POST', 'PUT', 'PATCH']:
            serializer = self.get_serializer(budget, data=request.data, partial=(request.method in ['PATCH', 'PUT']))
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
            
        elif request.method == 'DELETE':
            budget.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
