import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from django.http import HttpResponse
from datetime import datetime
from io import BytesIO

def export_transactions_to_excel(transactions):
    """
    Generates an Excel file from a queryset of transactions.
    """
    workbook = openpyxl.Workbook()
    worksheet = workbook.active
    worksheet.title = "Transactions"

    # Define headers
    headers = ["Date", "Description", "Category", "Type", "Payment Type", "Amount"]
    
    # Style for headers
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid") # Indigo color
    center_alignment = Alignment(horizontal="center")

    # Write headers
    for col_num, header in enumerate(headers, 1):
        cell = worksheet.cell(row=1, column=col_num)
        cell.value = header
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_alignment

    # Write data
    for row_num, transaction in enumerate(transactions, 2):
        # Format date
        date_str = transaction.date.strftime("%Y-%m-%d %H:%M") if transaction.date else ""
        
        # Payment type display
        payment_type_display = transaction.get_payment_type_display() if transaction.payment_type else ""
        
        # Type display
        type_display = transaction.get_type_display()

        row = [
            date_str,
            transaction.description,
            transaction.category or "Uncategorized",
            type_display,
            payment_type_display,
            transaction.amount
        ]

        for col_num, cell_value in enumerate(row, 1):
            cell = worksheet.cell(row=row_num, column=col_num)
            cell.value = cell_value
            if col_num == 6: # Amount column
                 cell.number_format = '#,##0.00'

    # Auto-adjust column widths
    for col_num, _ in enumerate(headers, 1):
        column_letter = get_column_letter(col_num)
        max_length = 0
        for cell in worksheet[column_letter]:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = (max_length + 2)
        worksheet.column_dimensions[column_letter].width = adjusted_width

    # Generate response
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = f'attachment; filename=transactions_{datetime.now().strftime("%Y%m%d")}.xlsx'
    
    workbook.save(response)
    return response

def export_vision_to_excel(entities):
    """
    Generates an Excel file from a queryset of VisionEntities (Assets/Liabilities).
    """
    workbook = openpyxl.Workbook()
    worksheet = workbook.active
    worksheet.title = "Balance Sheet"

    # Define headers
    headers = ["Name", "Type", "Category", "Amount", "Description"]
    
    # Style for headers
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid") # Indigo color
    center_alignment = Alignment(horizontal="center")

    # Write headers
    for col_num, header in enumerate(headers, 1):
        cell = worksheet.cell(row=1, column=col_num)
        cell.value = header
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_alignment

    # Write data
    total_assets = 0
    total_liabilities = 0

    for row_num, entity in enumerate(entities, 2):
        type_display = entity.get_type_display()
        
        if entity.type == 'asset':
            total_assets += entity.amount
        elif entity.type == 'liability':
            total_liabilities += entity.amount

        row = [
            entity.name,
            type_display,
            entity.category or "",
            entity.amount,
            entity.description or ""
        ]

        for col_num, cell_value in enumerate(row, 1):
            cell = worksheet.cell(row=row_num, column=col_num)
            cell.value = cell_value
            if col_num == 4: # Amount column
                 cell.number_format = '#,##0.00'

    # Add Summary at the bottom
    last_row = len(entities) + 4
    
    summary_data = [
        ("Total Assets", total_assets),
        ("Total Liabilities", total_liabilities),
        ("Net Worth", total_assets - total_liabilities)
    ]

    for i, (label, value) in enumerate(summary_data):
        row = last_row + i
        worksheet.cell(row=row, column=3).value = label
        worksheet.cell(row=row, column=3).font = Font(bold=True)
        cell = worksheet.cell(row=row, column=4)
        cell.value = value
        cell.number_format = '#,##0.00'
        cell.font = Font(bold=True)

    # Auto-adjust column widths
    for col_num, _ in enumerate(headers, 1):
        column_letter = get_column_letter(col_num)
        max_length = 0
        for cell in worksheet[column_letter]:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = (max_length + 2)
        worksheet.column_dimensions[column_letter].width = adjusted_width

    # Generate response
    response = HttpResponse(
        content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    )
    response['Content-Disposition'] = f'attachment; filename=balance_sheet_{datetime.now().strftime("%Y%m%d")}.xlsx'
    
    workbook.save(response)
    return response

def export_transactions_to_pdf(transactions):
    """
    Generates a PDF file from a queryset of transactions.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = styles['Title']
    elements.append(Paragraph(f"Transaction Report - {datetime.now().strftime('%Y-%m-%d')}", title_style))
    elements.append(Spacer(1, 12))

    # Table Data
    data = [["Date", "Description", "Category", "Type", "Payment", "Amount"]]
    
    total_income = 0
    total_expense = 0

    for t in transactions:
        date_str = t.date.strftime("%Y-%m-%d %H:%M") if t.date else ""
        amount = float(t.amount)
        
        if t.type == 'income':
            total_income += amount
        elif t.type == 'expense':
            total_expense += amount
            
        row = [
            date_str,
            t.description[:30] + ('...' if len(t.description) > 30 else ''), # Truncate long descriptions
            t.category or "-",
            t.get_type_display(),
            t.get_payment_type_display() if t.payment_type else "-",
            f"${amount:,.2f}"
        ]
        data.append(row)

    # Table Style
    table = Table(data, colWidths=[110, 200, 100, 80, 100, 80])
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4F46E5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('ALIGN', (1, 1), (1, -1), 'LEFT'), # Left align description
        ('ALIGN', (5, 1), (5, -1), 'RIGHT'), # Right align amount
    ]))
    
    elements.append(table)
    elements.append(Spacer(1, 24))

    # Summary
    summary_style = ParagraphStyle(
        'Summary',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=6
    )
    
    elements.append(Paragraph("<b>Summary:</b>", summary_style))
    elements.append(Paragraph(f"Total Income: ${total_income:,.2f}", summary_style))
    elements.append(Paragraph(f"Total Expense: ${total_expense:,.2f}", summary_style))
    elements.append(Paragraph(f"Net Balance: ${total_income - total_expense:,.2f}", summary_style))

    # Build PDF
    doc.build(elements)
    
    pdf = buffer.getvalue()
    buffer.close()
    
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=transactions_{datetime.now().strftime("%Y%m%d")}.pdf'
    response.write(pdf)
    return response

def export_vision_to_pdf(entities):
    """
    Generates a PDF file from a queryset of VisionEntities.
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=18)
    
    elements = []
    styles = getSampleStyleSheet()
    
    # Title
    title_style = styles['Title']
    elements.append(Paragraph(f"Balance Sheet - {datetime.now().strftime('%Y-%m-%d')}", title_style))
    elements.append(Spacer(1, 12))

    # Table Data
    data = [["Name", "Type", "Category", "Amount"]]
    
    total_assets = 0
    total_liabilities = 0

    for entity in entities:
        type_display = entity.get_type_display()
        if entity.type == 'asset':
            total_assets += entity.amount
        elif entity.type == 'liability':
            total_liabilities += entity.amount
            
        data.append([
            entity.name,
            type_display,
            entity.category or "",
            f"{entity.amount:,.2f}"
        ])

    # Create Table
    table = Table(data, colWidths=[150, 100, 100, 100])
    
    # Table Style
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#4F46E5")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ])
    table.setStyle(style)
    
    elements.append(table)
    elements.append(Spacer(1, 24))

    # Summary
    summary_style = styles['Normal']
    net_worth = total_assets - total_liabilities
    
    elements.append(Paragraph(f"<b>Total Assets:</b> {total_assets:,.2f}", summary_style))
    elements.append(Paragraph(f"<b>Total Liabilities:</b> {total_liabilities:,.2f}", summary_style))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"<b>Net Worth:</b> {net_worth:,.2f}", summary_style))

    # Build PDF
    doc.build(elements)
    
    pdf = buffer.getvalue()
    buffer.close()
    
    response = HttpResponse(content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename=balance_sheet_{datetime.now().strftime("%Y%m%d")}.pdf'
    response.write(pdf)
    return response
