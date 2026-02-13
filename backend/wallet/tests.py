from django.test import TestCase
from django.contrib.auth.models import User
from .models import Transaction, VisionEntity
from decimal import Decimal
from django.utils import timezone

class SignalTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        
        self.liability = VisionEntity.objects.create(
            user=self.user,
            name="Visa Card",
            type="liability",
            amount=Decimal("0.00")
        )
        
        self.asset = VisionEntity.objects.create(
            user=self.user,
            name="Bank",
            type="asset",
            amount=Decimal("1000.00")
        )

    def test_expense_increases_liability(self):
        """Test that adding an expense linked to a liability INCREASES the debt."""
        Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="expense",
            description="Dinner",
            date=timezone.now(),
            related_entity_id=str(self.liability.id)
        )
        
        self.liability.refresh_from_db()
        self.assertEqual(self.liability.amount, Decimal("100.00"))

    def test_expense_decreases_asset(self):
        """Test that adding an expense linked to an asset DECREASES the balance."""
        Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="expense",
            description="Groceries",
            date=timezone.now(),
            related_entity_id=str(self.asset.id)
        )
        
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.amount, Decimal("900.00"))

    def test_income_increases_asset(self):
        """Test that adding income linked to an asset INCREASES the balance."""
        Transaction.objects.create(
            user=self.user,
            amount=Decimal("500.00"),
            type="income",
            description="Salary",
            date=timezone.now(),
            related_entity_id=str(self.asset.id)
        )
        
        self.asset.refresh_from_db()
        self.assertEqual(self.asset.amount, Decimal("1500.00"))

    def test_update_transaction(self):
        """Test that updating a transaction adjusts the balance correctly."""
        tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="expense",
            description="Dinner",
            date=timezone.now(),
            related_entity_id=str(self.liability.id)
        )
        
        self.liability.refresh_from_db()
        self.assertEqual(self.liability.amount, Decimal("100.00"))
        
        # Update amount 100 -> 200
        tx.amount = Decimal("200.00")
        tx.save()
        
        self.liability.refresh_from_db()
        self.assertEqual(self.liability.amount, Decimal("200.00"))

    def test_delete_transaction(self):
        """Test that deleting a transaction reverses the effect."""
        tx = Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="expense",
            description="Dinner",
            date=timezone.now(),
            related_entity_id=str(self.liability.id)
        )
        
        self.liability.refresh_from_db()
        self.assertEqual(self.liability.amount, Decimal("100.00"))
        
        tx.delete()
        
        self.liability.refresh_from_db()
        self.assertEqual(self.liability.amount, Decimal("0.00"))

    def test_transfer_asset_to_liability(self):
        """Test paying off debt (Asset -> Liability)."""
        # Set initial debt
        self.liability.amount = Decimal("500.00")
        self.liability.save()
        
        Transaction.objects.create(
            user=self.user,
            amount=Decimal("100.00"),
            type="transfer",
            description="Pay Card",
            date=timezone.now(),
            related_entity_id=str(self.asset.id), # Source
            transfer_related_entity_id=str(self.liability.id) # Dest
        )
        
        self.asset.refresh_from_db()
        self.liability.refresh_from_db()
        
        # Asset: 1000 - 100 = 900
        self.assertEqual(self.asset.amount, Decimal("900.00"))
        # Liability: 500 - 100 = 400
        self.assertEqual(self.liability.amount, Decimal("400.00"))
