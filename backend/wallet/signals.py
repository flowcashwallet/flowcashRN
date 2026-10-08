from django.db.models.signals import post_save, pre_save, post_delete
from django.dispatch import receiver
from django.db import transaction as db_transaction
from django.utils import timezone
from .models import Transaction, VisionEntity
from decimal import Decimal

def update_entity_balance(entity_id, amount, transaction_type, is_reversal=False):
    """
    Updates the balance of a VisionEntity based on transaction details.
    
    Logic:
    - Expense + Asset: Decrease Balance (Spending money you have)
    - Expense + Liability: Increase Balance (Increasing debt)
    - Income + Asset: Increase Balance (Receiving money)
    - Income + Liability: Decrease Balance (Paying off debt / Refund)
    - Transfer: Handle Source (related_entity_id) and Destination (transfer_related_entity_id) separately
    
    is_reversal: True if we are undoing a transaction (e.g. pre_save update or delete)
    """
    if not entity_id:
        return

    try:
        # Handle case where entity_id might be string or int
        entity = VisionEntity.objects.get(pk=int(entity_id))
    except (VisionEntity.DoesNotExist, ValueError):
        return

    amount = Decimal(amount)
    if is_reversal:
        amount = -amount

    if entity.type == 'asset':
        if transaction_type == 'expense':
            entity.amount -= amount
        elif transaction_type == 'income':
            entity.amount += amount
        elif transaction_type == 'transfer':
            # If this is the source of a transfer, it decreases
            entity.amount -= amount
        elif transaction_type == 'adjustment':
            # amount is already the signed delta (see log_entity_amount_adjustment)
            entity.amount += amount

    elif entity.type == 'liability':
        if transaction_type == 'expense':
            # Spending on credit card -> Debt Increases
            entity.amount += amount
        elif transaction_type == 'income':
            # Refund to credit card -> Debt Decreases
            entity.amount -= amount
        elif transaction_type == 'transfer':
            # Transfer FROM liability (Cash advance) -> Debt Increases
            entity.amount += amount
        elif transaction_type == 'adjustment':
            entity.amount += amount

    # Marks this save as transaction-driven so the VisionEntity signals below
    # don't log it a second time as a manual "adjustment" — it's already
    # being recorded as its own income/expense/transfer transaction.
    entity._skip_adjustment_log = True
    entity.save()

@receiver(pre_save, sender=Transaction)
def store_old_transaction_state(sender, instance, **kwargs):
    """
    Before saving, if this is an update, reverse the effect of the OLD transaction data.
    """
    if instance.pk:
        try:
            old_instance = Transaction.objects.get(pk=instance.pk)
            
            # Reverse Primary Entity Effect
            if old_instance.related_entity_id:
                # Special handling for Transfer destination
                is_transfer_source = (old_instance.type == 'transfer')
                update_entity_balance(
                    old_instance.related_entity_id, 
                    old_instance.amount, 
                    old_instance.type, 
                    is_reversal=True
                )

            # Reverse Transfer Destination Effect
            if old_instance.type == 'transfer' and old_instance.transfer_related_entity_id:
                # Destination logic is inverted relative to Source
                # Asset Dest: Increases (+ amount) -> Reversal: Decrease (- amount)
                # Liability Dest: Decreases (- amount) -> Reversal: Increase (+ amount)
                
                # To reuse update_entity_balance, we treat destination as "Income" for Asset 
                # and "Income" (Payment) for Liability?
                # Simpler: Just inline the logic for destination or make helper smarter.
                
                # Let's do manual reversal for destination to be safe/clear
                dest_id = old_instance.transfer_related_entity_id
                try:
                    dest = VisionEntity.objects.get(pk=int(dest_id))
                    amt = Decimal(old_instance.amount)
                    # Reversing:
                    if dest.type == 'asset':
                        dest.amount -= amt # Originally added, now subtract
                    elif dest.type == 'liability':
                        dest.amount += amt # Originally subtracted (payment), now add back
                    dest._skip_adjustment_log = True
                    dest.save()
                except (VisionEntity.DoesNotExist, ValueError):
                    pass

        except Transaction.DoesNotExist:
            pass

@receiver(post_save, sender=Transaction)
def apply_new_transaction_state(sender, instance, created, **kwargs):
    """
    After saving, apply the effect of the NEW transaction data.
    """
    # A freshly auto-generated 'adjustment' transaction already reflects a
    # balance change that was applied directly to the entity — that's what
    # triggered its creation (see log_entity_amount_adjustment). Applying it
    # again here would double the change. Only an EDIT of an *existing*
    # adjustment transaction (created=False) should flow back into the
    # entity's balance, since in that case the entity wasn't touched.
    skip_primary = instance.type == 'adjustment' and created

    # 1. Primary Entity
    if instance.related_entity_id and not skip_primary:
        update_entity_balance(
            instance.related_entity_id,
            instance.amount,
            instance.type,
            is_reversal=False
        )

    # 2. Transfer Destination
    if instance.type == 'transfer' and instance.transfer_related_entity_id:
        dest_id = instance.transfer_related_entity_id
        try:
            dest = VisionEntity.objects.get(pk=int(dest_id))
            amt = Decimal(instance.amount)
            
            if dest.type == 'asset':
                dest.amount += amt # Receiving money
            elif dest.type == 'liability':
                dest.amount -= amt # Debt being paid off
            dest._skip_adjustment_log = True
            dest.save()
        except (VisionEntity.DoesNotExist, ValueError):
            pass

@receiver(post_delete, sender=Transaction)
def reverse_deleted_transaction(sender, instance, **kwargs):
    """
    If a transaction is deleted, reverse its effect.
    """
    # 1. Primary Entity
    if instance.related_entity_id:
        update_entity_balance(
            instance.related_entity_id, 
            instance.amount, 
            instance.type, 
            is_reversal=True # Reversal = Undo the effect
        )

    # 2. Transfer Destination
    if instance.type == 'transfer' and instance.transfer_related_entity_id:
        dest_id = instance.transfer_related_entity_id
        try:
            dest = VisionEntity.objects.get(pk=int(dest_id))
            amt = Decimal(instance.amount)
            
            # Reversing destination effect
            if dest.type == 'asset':
                dest.amount -= amt
            elif dest.type == 'liability':
                dest.amount += amt
            dest._skip_adjustment_log = True
            dest.save()
        except (VisionEntity.DoesNotExist, ValueError):
            pass

@receiver(pre_save, sender=VisionEntity)
def store_old_entity_amount(sender, instance, **kwargs):
    """Remembers the balance before this save, for the post_save comparison below."""
    if instance.pk:
        try:
            instance._old_amount = VisionEntity.objects.get(pk=instance.pk).amount
        except VisionEntity.DoesNotExist:
            instance._old_amount = None
    else:
        instance._old_amount = None

@receiver(post_save, sender=VisionEntity)
def log_entity_amount_adjustment(sender, instance, created, **kwargs):
    """
    Records a manual balance edit (e.g. correcting an asset/liability's
    amount from Balance) as a neutral 'adjustment' transaction, so it shows
    up in the history without counting as income or expense — same idea as
    'transfer'. Skipped when the amount change actually came from a real
    transaction (income/expense/transfer already logs itself; see
    `_skip_adjustment_log` set by `update_entity_balance` and the transfer-
    destination saves above) or from creating the entity for the first time.

    `amount` is stored SIGNED for this type only (positive = balance went
    up, negative = went down) — it's the only way the frontend can tell
    direction apart, since this never flows through the income/expense
    type-implies-sign convention the way other transactions do.
    """
    if created or getattr(instance, '_skip_adjustment_log', False):
        return

    old_amount = getattr(instance, '_old_amount', None)
    if old_amount is None:
        return

    delta = instance.amount - old_amount
    if delta == 0:
        return

    Transaction.objects.create(
        user=instance.user,
        amount=delta,
        type='adjustment',
        description=f'Ajuste de saldo: {instance.name}',
        category=instance.category,
        related_entity_id=str(instance.id),
        date=timezone.now(),
    )
