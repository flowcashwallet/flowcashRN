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
    # 1. Primary Entity
    if instance.related_entity_id:
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
    print(f"[store_old_entity_amount] entity pk={instance.pk} old_amount={getattr(instance, '_old_amount', 'MISSING')}")

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
    """
    skip_flag = getattr(instance, '_skip_adjustment_log', False)
    old_amount = getattr(instance, '_old_amount', 'MISSING')
    print(
        f"[log_entity_amount_adjustment] entity pk={instance.pk} created={created} "
        f"skip_flag={skip_flag} old_amount={old_amount} new_amount={instance.amount}"
    )

    if created or skip_flag:
        print("[log_entity_amount_adjustment] skipped: created or skip_flag")
        return

    old_amount = getattr(instance, '_old_amount', None)
    if old_amount is None:
        print("[log_entity_amount_adjustment] skipped: old_amount is None/missing")
        return

    delta = instance.amount - old_amount
    print(f"[log_entity_amount_adjustment] delta={delta}")
    if delta == 0:
        print("[log_entity_amount_adjustment] skipped: delta is 0")
        return

    print(f"[log_entity_amount_adjustment] creating adjustment transaction, amount={abs(delta)}")
    Transaction.objects.create(
        user=instance.user,
        amount=abs(delta),
        type='adjustment',
        description=f'Ajuste de saldo: {instance.name}',
        category=instance.category,
        related_entity_id=str(instance.id),
        date=timezone.now(),
    )
