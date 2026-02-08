from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Transaction, Budget, Category, Subscription
from .serializers import TransactionSerializer, BudgetSerializer, CategorySerializer, SubscriptionSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user).order_by('name')
    
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

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

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
