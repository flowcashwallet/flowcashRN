import re
from .ml import CategoryPredictor
from .models import VisionEntity

def parse_voice_command(text, user):
    """
    Parsea un comando de voz transcrito para extraer:
    - Monto (float)
    - Descripción (string limpio)
    - Categoría (predicha)
    - Entidad relacionada (VisionEntity)
    
    Ejemplo entrada: "Gasté quinientos cincuenta pesos en Oxxo para unas papas"
    Ejemplo salida: { amount: 550.0, description: "Oxxo papas", category: "Supermercado" }
    """
    if not text:
        return None

    # 1. Normalización
    original_text = text
    text = text.lower()
    
    # 2. Extracción de Monto
    # Intenta buscar números primero (500, 50.50)
    amount = 0.0
    amount_match = re.search(r'(\d+(?:\.\d{1,2})?)', text)
    
    if amount_match:
        amount = float(amount_match.group(1))
        # Removemos el monto del texto para no confundirlo con descripción
        text = text.replace(amount_match.group(0), "")
    else:
        # 3. Conversión básica de texto a número (para casos comunes donde STT falla)
        # Esto es muy básico, idealmente usaríamos una librería como 'text2num' si fuera crítico
        # Mapeo simple de unidades y decenas comunes en gastos rápidos
        text_nums = {
            'uno': 1, 'una': 1, 'dos': 2, 'tres': 3, 'cuatro': 4, 'cinco': 5,
            'seis': 6, 'siete': 7, 'ocho': 8, 'nueve': 9, 'diez': 10,
            'veinte': 20, 'treinta': 30, 'cuarenta': 40, 'cincuenta': 50,
            'sesenta': 60, 'setenta': 70, 'ochenta': 80, 'noventa': 90,
            'cien': 100, 'ciento': 100, 'doscientos': 200, 'trescientos': 300,
            'cuatrocientos': 400, 'quinientos': 500, 'mil': 1000
        }
        
        words = text.split()
        temp_amount = 0
        
        # Buscamos palabras numéricas y las sumamos (muy naive, pero funciona para "veinte pesos" o "mil quinientos")
        for w in words:
            if w in text_nums:
                # Si encontramos un número, lo sumamos y lo removemos del texto para la descripción
                temp_amount += text_nums[w]
                text = text.replace(w, "")
        
        if temp_amount > 0:
            amount = float(temp_amount)

    # 3.5. Extracción de Entidad (VisionEntity)
    related_entity_id = None
    related_entity_name = None
    
    # Solo buscamos si hay usuario (por si acaso)
    if user and not user.is_anonymous:
        user_entities = VisionEntity.objects.filter(user=user)
        # Ordenamos por longitud de nombre descendente para matchear nombres más largos primero
        sorted_entities = sorted(user_entities, key=lambda e: len(e.name), reverse=True)
        
        for entity in sorted_entities:
            entity_name_normalized = entity.name.lower()
            if entity_name_normalized in text:
                related_entity_id = entity.id
                related_entity_name = entity.name
                # Removemos el nombre de la entidad del texto
                text = text.replace(entity_name_normalized, "")
                break

    # 4. Limpieza (Stopwords y palabras de relleno)
    stopwords = [
        'gaste', 'gasté', 'pague', 'pagué', 'compre', 'compré', 'transferi', 'transferí',
        'en', 'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
        'pesos', 'dolares', 'euros', 'mxn', 'usd',
        'para', 'por', 'de', 'a', 'con', 'y',
        'asocialo', 'asocia', 'pasivo', 'activo', 'entidad', 'cuenta'
    ]
    
    words = text.split()
    clean_words = [w for w in words if w not in stopwords]
    description = " ".join(clean_words).strip()
    
    # Si la descripción quedó vacía (ej: "Gasté 500"), poner algo genérico
    if not description:
        description = "Gasto general"

    # 4. Predicción de Categoría
    predictor = CategoryPredictor(user)
    # Entrenamos (carga datos del usuario)
    predictor.train()
    
    predicted_category = predictor.predict(description)
    
    # 5. Determinar Tipo (Gasto vs Ingreso vs Transferencia)
    # Por defecto es Gasto (expense)
    transaction_type = 'expense'
    if any(w in text for w in ['ingreso', 'gane', 'gané', 'recibi', 'recibí', 'deposito']):
        transaction_type = 'income'
    # elif 'transfer' in text: transaction_type = 'transfer' # Futuro

    return {
        "amount": amount,
        "category": predicted_category, # Puede ser None
        "description": description.capitalize(),
        "type": transaction_type,
        "original_text": original_text,
        "relatedEntityId": related_entity_id,
        "relatedEntityName": related_entity_name
    }
