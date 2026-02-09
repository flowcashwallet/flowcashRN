import json
from datetime import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
import firebase_admin
from firebase_admin import credentials, firestore
from wallet.models import Transaction, Category, Subscription, VisionEntity, Budget, FixedExpense

User = get_user_model()

class Command(BaseCommand):
    help = 'Migrate data from Firebase Firestore to Django PostgreSQL'

    def add_arguments(self, parser):
        parser.add_argument('--key-path', type=str, help='Path to the Firebase Service Account Key JSON file', required=False)
        parser.add_argument('--email', type=str, help='Specific email to migrate (optional)', required=False)

    def handle(self, *args, **options):
        key_path = options.get('key_path')
        target_email = options.get('email')

        # Initialize Firebase Admin
        if not firebase_admin._apps:
            cred = None
            if key_path:
                self.stdout.write(self.style.SUCCESS(f'Starting migration with key file: {key_path}'))
                cred = credentials.Certificate(key_path)
            else:
                import os
                firebase_creds = os.environ.get('FIREBASE_CREDENTIALS')
                if firebase_creds:
                    self.stdout.write(self.style.SUCCESS('Starting migration with FIREBASE_CREDENTIALS env var'))
                    try:
                        cred_dict = json.loads(firebase_creds)
                        cred = credentials.Certificate(cred_dict)
                    except json.JSONDecodeError:
                        self.stdout.write(self.style.ERROR('FIREBASE_CREDENTIALS is not valid JSON'))
                        return
                else:
                    self.stdout.write(self.style.ERROR('Please provide --key-path OR set FIREBASE_CREDENTIALS env var'))
                    return

            firebase_admin.initialize_app(cred)
        
        db = firestore.client()

        # Get Users from Firebase Auth is tricky without auth export.
        # Strategy: Iterate through 'users' collection or 'transactions' to find unique UIDs?
        # Better: Assume we want to migrate data for users who have signed up in Django with the SAME email.
        # Or, just iterate a list of known emails if provided, or scan a collection.
        # Let's scan the 'transactions' collection to find unique UIDs, or if there is a 'users' collection.
        
        # Let's try to get users from Django and find their data in Firebase
        django_users = User.objects.all()
        if target_email:
            django_users = django_users.filter(email=target_email)

        if not django_users.exists():
            self.stdout.write(self.style.WARNING("No Django users found to migrate. Please register the user in Django first."))
            return

        for user in django_users:
            self.stdout.write(f"Checking data for user: {user.email}")
            
            # We need the Firebase UID. 
            # Problem: We don't have the mapping Email -> Firebase UID unless we query Firebase Auth (requires admin SDK auth privilege)
            # OR if we assume the user might have stored it somewhere.
            # Let's use the Admin SDK to look up the user by email.
            try:
                from firebase_admin import auth
                firebase_user = auth.get_user_by_email(user.email)
                firebase_uid = firebase_user.uid
                self.stdout.write(self.style.SUCCESS(f"Found Firebase UID: {firebase_uid}"))
                
                self.migrate_user_data(user, firebase_uid, db)
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Could not find user {user.email} in Firebase: {e}"))
                continue

    def get_user_docs(self, db, collection_names, firebase_uid):
        """
        Try to find documents for a user in multiple possible collection names
        and using multiple possible user ID field names.
        """
        if isinstance(collection_names, str):
            collection_names = [collection_names]

        for col_name in collection_names:
            col_ref = db.collection(col_name)
            
            # Try 'uid' field
            docs = list(col_ref.where('uid', '==', firebase_uid).stream())
            if docs:
                self.stdout.write(f"Found {len(docs)} docs in '{col_name}' using field 'uid'")
                return docs, col_name
            
            # Try 'userId' field
            docs = list(col_ref.where('userId', '==', firebase_uid).stream())
            if docs:
                self.stdout.write(f"Found {len(docs)} docs in '{col_name}' using field 'userId'")
                return docs, col_name
                
            # Try 'user_id' field
            docs = list(col_ref.where('user_id', '==', firebase_uid).stream())
            if docs:
                self.stdout.write(f"Found {len(docs)} docs in '{col_name}' using field 'user_id'")
                return docs, col_name

        self.stdout.write(self.style.WARNING(f"No documents found for user {firebase_uid} in collections {collection_names}"))
        return [], None

    def migrate_user_data(self, django_user, firebase_uid, db):
        # 1. Categories
        self.stdout.write("Migrating Categories...")
        cat_docs, _ = self.get_user_docs(db, ['categories', 'Categories'], firebase_uid)
        
        for doc in cat_docs:
            data = doc.to_dict()
            cat_name = data.get('name')
            if not cat_name: continue

            # Check if exists
            Category.objects.get_or_create(
                user=django_user,
                name=cat_name,
                defaults={
                    'created_at': timezone.now()
                }
            )
            
        # 2. Vision Entities (Assets/Liabilities) - MIGRATE BEFORE TRANSACTIONS
        self.stdout.write("Migrating Vision Entities...")
        vision_docs, _ = self.get_user_docs(db, ['vision', 'vision_entities', 'visionEntities', 'assets', 'liabilities'], firebase_uid)
        vision_map = {} # Map Firebase ID -> Django ID (string)
        
        for doc in vision_docs:
            data = doc.to_dict()
            name = data.get('name', 'Unnamed')
            amount = float(data.get('amount', 0))
            type_ = data.get('type', 'asset')
            
            # Check if exists
            vision_entity, created = VisionEntity.objects.get_or_create(
                user=django_user,
                name=name,
                type=type_,
                defaults={
                    'amount': amount,
                    'category': data.get('category', 'General'),
                    'description': data.get('description', ''),
                    'is_crypto': data.get('isCrypto', False),
                    'is_credit_card': data.get('isCreditCard', False),
                    'cutoff_date': data.get('cutoffDate'),
                    'payment_date': data.get('paymentDate'),
                    'issuer_bank': data.get('issuerBank')
                }
            )
            
            # Store mapping
            vision_map[doc.id] = str(vision_entity.id)
            if created:
                self.stdout.write(f"  Created entity: {name}")

        # 3. Transactions
        self.stdout.write("Migrating Transactions...")
        tx_docs, _ = self.get_user_docs(db, ['transactions', 'Transactions'], firebase_uid)
        
        for doc in tx_docs:
            data = doc.to_dict()
            
            # Map fields
            description = data.get('description', 'Sin descripción')
            amount = float(data.get('amount', 0))
            type_ = data.get('type', 'expense')
            
            # Date handling
            date_val = data.get('date')
            tx_date = timezone.now()
            if date_val:
                if hasattr(date_val, 'timestamp'): # Firestore Timestamp
                    tx_date = datetime.fromtimestamp(date_val.timestamp(), tz=timezone.utc)
                elif isinstance(date_val, str): # ISO String
                    try:
                        tx_date = datetime.fromisoformat(date_val.replace('Z', '+00:00'))
                    except:
                        pass
                elif isinstance(date_val, int): # Milliseconds
                    tx_date = datetime.fromtimestamp(date_val / 1000.0, tz=timezone.utc)

            # Category
            cat_name = data.get('category')
            category_obj = None
            if cat_name:
                category_obj, _ = Category.objects.get_or_create(user=django_user, name=cat_name)

            # Related Entity Mapping
            related_id = data.get('relatedEntityId') or data.get('related_entity_id')
            new_related_id = None
            if related_id and related_id in vision_map:
                new_related_id = vision_map[related_id]

            # Check for duplicate
            if not Transaction.objects.filter(
                user=django_user,
                description=description,
                amount=amount,
                date=tx_date,
                type=type_
            ).exists():
                Transaction.objects.create(
                    user=django_user,
                    description=description,
                    amount=amount,
                    type=type_,
                    category=category_obj.name if category_obj else 'General',
                    date=tx_date,
                    payment_type=data.get('paymentType', 'cash'),
                    related_entity_id=new_related_id
                )
            else:
                self.stdout.write(f"  Skipping duplicate transaction: {description}")
        
        self.stdout.write("Transactions migrated.")

        # 4. Subscriptions
        self.stdout.write("Migrating Subscriptions...")
        sub_docs, _ = self.get_user_docs(db, ['subscriptions', 'Subscriptions'], firebase_uid)
        
        for doc in sub_docs:
            data = doc.to_dict()
            name = data.get('name', 'Subscription')
            
            # Date handling
            npd_val = data.get('nextPaymentDate')
            npd = timezone.now()
            if isinstance(npd_val, int):
                 npd = datetime.fromtimestamp(npd_val / 1000.0, tz=timezone.utc)
            
            # Related Entity Mapping
            related_id = data.get('relatedEntityId') or data.get('related_entity_id')
            new_related_id = None
            if related_id and related_id in vision_map:
                new_related_id = vision_map[related_id]

            if not Subscription.objects.filter(user=django_user, name=name).exists():
                Subscription.objects.create(
                    user=django_user,
                    name=name,
                    amount=float(data.get('amount', 0)),
                    category=data.get('category', 'General'),
                    frequency=data.get('frequency', 'monthly'),
                    next_payment_date=npd,
                    reminder_enabled=data.get('reminderEnabled', False),
                    description=data.get('description', ''),
                    related_entity_id=new_related_id
                )

        # 5. Budget
        self.stdout.write("Migrating Budget...")
        # Try 'budgets' collection with doc ID = uid
        budget_ref = db.collection('budgets').document(firebase_uid).get()
        if not budget_ref.exists:
             # Try query
             budget_docs, _ = self.get_user_docs(db, ['budgets'], firebase_uid)
             if budget_docs:
                 budget_ref = budget_docs[0] # Take first

        if budget_ref.exists:
            data = budget_ref.to_dict()
            budget, _ = Budget.objects.get_or_create(user=django_user)
            budget.monthly_income = float(data.get('monthlyIncome', 0))
            budget.is_setup = data.get('isSetup', False)
            budget.save()
            
            # Fixed Expenses
            if 'fixedExpenses' in data:
                for fe in data['fixedExpenses']:
                    FixedExpense.objects.create(
                        budget=budget,
                        name=fe.get('name'),
                        amount=float(fe.get('amount', 0)),
                        category=fe.get('category', 'General')
                    )

        self.stdout.write(self.style.SUCCESS(f"Successfully migrated data for {django_user.email}"))
