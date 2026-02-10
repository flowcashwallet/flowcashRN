import openpyxl
from datetime import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from wallet.models import Transaction

class Command(BaseCommand):
    help = 'Import transactions from Excel export for debugging'

    def add_arguments(self, parser):
        parser.add_argument('file_path', type=str, help='Path to the Excel file')
        parser.add_argument('--username', type=str, default='debug_user', help='Username to import data into')

    def handle(self, *args, **options):
        file_path = options['file_path']
        username = options['username']
        
        User = get_user_model()
        user, created = User.objects.get_or_create(username=username)
        if created:
            user.set_password('debug123')
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Created user: {username}'))
        
        # Clear existing transactions for this debug user
        count = Transaction.objects.filter(user=user).delete()[0]
        self.stdout.write(f'Cleared {count} existing transactions for {username}')

        try:
            wb = openpyxl.load_workbook(file_path)
            ws = wb.active
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error loading Excel: {e}'))
            return

        # Columns (0-indexed) based on new layout:
        # Income: A=0 (Date), B=1 (Desc), C=2 (Amount)
        # Expense: E=4 (Date), F=5 (Desc), G=6 (Amount)
        
        incomes_created = 0
        expenses_created = 0
        
        for row in ws.iter_rows(min_row=3, values_only=True):
            # Row is a tuple of values
            
            # Income
            if len(row) >= 3 and row[0] and row[2] is not None:
                try:
                    date_str = row[0]
                    desc_raw = row[1] or "Income"
                    amount = float(row[2])
                    
                    date_obj = self.parse_date(date_str)
                    category, description = self.parse_desc(desc_raw)
                    
                    Transaction.objects.create(
                        user=user,
                        type='income',
                        amount=amount,
                        date=date_obj,
                        category=category,
                        description=description
                    )
                    incomes_created += 1
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Skipped Income Row: {e}'))

            # Expense
            if len(row) >= 7 and row[4] and row[6] is not None:
                try:
                    date_str = row[4]
                    desc_raw = row[5] or "Expense"
                    amount = float(row[6])
                    
                    date_obj = self.parse_date(date_str)
                    category, description = self.parse_desc(desc_raw)
                    
                    Transaction.objects.create(
                        user=user,
                        type='expense',
                        amount=amount,
                        date=date_obj,
                        category=category,
                        description=description
                    )
                    expenses_created += 1
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'Skipped Expense Row: {e}'))

        self.stdout.write(self.style.SUCCESS(f'Successfully imported {incomes_created} incomes and {expenses_created} expenses for {username}'))

    def parse_date(self, date_val):
        # date_val might be a datetime object (from openpyxl) or a string
        if isinstance(date_val, datetime) or hasattr(date_val, 'date'):
            return date_val
        try:
            return datetime.strptime(str(date_val), '%Y-%m-%d')
        except:
            # Fallback or error
            return datetime.now()

    def parse_desc(self, raw_desc):
        # Format "Category: Description"
        parts = str(raw_desc).split(':', 1)
        if len(parts) == 2:
            return parts[0].strip(), parts[1].strip()
        return "General", raw_desc
