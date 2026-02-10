import re
import math
from collections import defaultdict
from .models import Transaction, Category

class CategoryPredictor:
    def __init__(self, user):
        self.user = user
        # Estructuras de datos para Naive Bayes (Pure Python)
        self.vocab = set()
        self.word_counts = defaultdict(lambda: defaultdict(int)) # {category: {word: count}}
        self.category_counts = defaultdict(int) # {category: total_words}
        self.category_doc_counts = defaultdict(int) # {category: total_docs}
        self.total_docs = 0
        self.is_trained = False
        
        # User specific categories loaded from DB
        self.user_categories = set()
        
        # Base de Conocimiento de Keywords Comunes (Common Knowledge Base)
        # Mapea palabras clave a categorías "estándar" o conceptos
        self.common_keywords = {
            'uber': ['transporte', 'viajes'],
            'didi': ['transporte', 'viajes'],
            'taxi': ['transporte', 'viajes'],
            'gasolina': ['transporte', 'auto', 'coche'],
            'shell': ['transporte', 'auto', 'gasolina'],
            'bp': ['transporte', 'auto', 'gasolina'],
            
            'netflix': ['entretenimiento', 'suscripciones'],
            'spotify': ['entretenimiento', 'suscripciones'],
            'youtube': ['entretenimiento', 'suscripciones'],
            'cine': ['entretenimiento', 'salidas'],
            'steam': ['entretenimiento', 'juegos'],
            
            'cfe': ['servicios', 'hogar', 'luz', 'electricidad'],
            'luz': ['servicios', 'hogar'],
            'agua': ['servicios', 'hogar'],
            'internet': ['servicios', 'hogar', 'internet'],
            'telmex': ['servicios', 'hogar', 'internet'],
            'totalplay': ['servicios', 'hogar', 'internet'],
            'gas': ['servicios', 'hogar'],
            
            'walmart': ['supermercado', 'comida', 'hogar'],
            'soriana': ['supermercado', 'comida', 'hogar'],
            'costco': ['supermercado', 'comida', 'hogar'],
            'oxxo': ['supermercado', 'comida', 'tienda'],
            'restaurante': ['comida', 'restaurantes'],
            'tacos': ['comida', 'restaurantes'],
            'pizza': ['comida', 'restaurantes'],
            'cafe': ['comida', 'cafe'],
            'starbucks': ['comida', 'cafe'],
            
            'sueldo': ['ingresos', 'salario', 'nomina'],
            'nomina': ['ingresos', 'salario'],
            'deposito': ['ingresos', 'transferencia'],
            
            'renta': ['hogar', 'vivienda'],
            'hipoteca': ['hogar', 'vivienda'],
            'mantenimiento': ['hogar', 'servicios'],
            
            'gym': ['salud', 'deporte'],
            'gimnasio': ['salud', 'deporte'],
            'doctor': ['salud', 'medico'],
            'farmacia': ['salud', 'medicamentos'],
        }
        
        # Stopwords en español para limpiar ruido
        self.stopwords = {
            'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
            'y', 'e', 'ni', 'o', 'u',
            'a', 'ante', 'bajo', 'cabe', 'con', 'contra', 'de', 'desde',
            'en', 'entre', 'hacia', 'hasta', 'para', 'por', 'segun',
            'sin', 'so', 'sobre', 'tras',
            'pago', 'transferencia', 'spei', 'compra', 'cargo'
        }

    def _tokenize(self, text):
        """
        Tokeniza el texto: minúsculas, elimina puntuación, split por espacios.
        Filtra stopwords y palabras cortas.
        """
        if not text:
            return []
        text = str(text).lower()
        # Reemplazar todo lo que no sea alfanumérico con espacios
        text = re.sub(r'[^a-z0-9\u00C0-\u00FF\s]', ' ', text) # \u00C0-\u00FF incluye acentos
        # Split y eliminar espacios vacíos y stopwords
        tokens = [
            t for t in text.split() 
            if len(t) > 2 and t not in self.stopwords
        ] 
        return tokens

    def train(self):
        """
        Entrena el modelo usando el historial de transacciones del usuario.
        Carga también las categorías disponibles del usuario.
        """
        # 0. Cargar categorías del usuario para el matching híbrido
        user_cats = Category.objects.filter(user=self.user).values_list('name', flat=True)
        self.user_categories = set(c.lower() for c in user_cats)
        
        # 1. Obtener transacciones del usuario
        transactions = Transaction.objects.filter(user=self.user).exclude(
            description__isnull=True
        ).exclude(
            description__exact=''
        ).exclude(
            category__isnull=True
        ).values('description', 'category')
        
        count = len(transactions)
        
        # Si hay pocas transacciones, marcaremos como no entrenado para NB,
        # PERO aún podemos usar el matching por keywords y nombre.
        if count >= 5:
            self.is_trained = True
            self.total_docs = count
            
            # 2. Construir frecuencias para Naive Bayes
            for t in transactions:
                category = t['category']
                if not category:
                    continue
                    
                tokens = self._tokenize(t['description'])
                if not tokens:
                    continue
                
                self.category_doc_counts[category] += 1
                
                for token in tokens:
                    self.vocab.add(token)
                    self.word_counts[category][token] += 1
                    self.category_counts[category] += 1
        else:
            self.is_trained = False

    def predict(self, description):
        """
        Predice la categoría usando una estrategia híbrida:
        1. Coincidencia Directa de Nombre de Categoría (Prioridad Alta)
        2. Diccionario de Keywords Comunes mapeado a Categorías del Usuario (Prioridad Media)
        3. Naive Bayes con historial (Prioridad Baja / Refinamiento)
        """
        if not description:
            return None
        
        tokens = self._tokenize(description)
        if not tokens:
            return None
            
        # --- Estrategia 1: Coincidencia Directa (Name Match) ---
        # Si la descripción contiene el nombre de una categoría existente
        # Ejemplo: "Pago de Internet" -> User tiene categoría "Internet"
        for token in tokens:
            # Check exact match
            if token in self.user_categories:
                # Buscamos el nombre original (con mayúsculas si aplica) que coincida
                # Aunque aquí retornamos el string en lowercase, el frontend/backend debería manejarlo.
                # Lo ideal es retornar el nombre exacto como está en DB.
                # Como self.user_categories es un set de strings lower, buscamos cual matchea.
                # Para simplificar, retornamos el token capitalizado o buscamos de nuevo.
                # Lo mejor es retornar el nombre tal cual lo tiene el usuario.
                # Haremos una búsqueda rápida inversa si es necesario, o retornamos el token.
                # Dado que guardamos en lower, vamos a intentar devolverlo 'Title Case' si no tenemos el map original.
                # Mejor: iterar sobre las categorias originales si queremos exactitud, pero por performance:
                return token.title() 

        # --- Estrategia 2: Keywords Comunes (Common Knowledge) ---
        # Ejemplo: "Agua" -> map a 'servicios', 'hogar'. User tiene 'Servicios'. Match!
        detected_concepts = set()
        for token in tokens:
            if token in self.common_keywords:
                detected_concepts.update(self.common_keywords[token])
        
        # Ver si algún concepto detectado existe en las categorías del usuario
        for concept in detected_concepts:
            if concept in self.user_categories:
                return concept.title()
                
            # Intento de matching parcial (ej. 'servicios' matchea 'servicios básicos')
            for user_cat in self.user_categories:
                if concept in user_cat: # substring match
                    return user_cat.title()

        # --- Estrategia 3: Naive Bayes (History) ---
        # Solo si está entrenado
        if self.is_trained:
            return self._predict_naive_bayes(tokens)
            
        return None

    def _predict_naive_bayes(self, tokens):
        """
        Ejecuta la predicción Naive Bayes estándar.
        Incluye 'Zero Hit Guard' para evitar falsos positivos por Priors dominantes.
        """
        best_category = None
        max_log_prob = -float('inf')
        
        # Vocab size para Laplace smoothing
        vocab_size = len(self.vocab)
        
        # ZERO HIT GUARD: Contar cuántas palabras de la descripción
        # realmente existen en nuestro vocabulario aprendido.
        hits = 0
        for token in tokens:
            if token in self.vocab:
                hits += 1
        
        # Si ninguna palabra se ha visto antes, NB solo retornará la categoría más común (Prior).
        # Esto suele ser incorrecto para palabras nuevas (ej. "Agua" -> "Transporte").
        # En este caso, es mejor no adivinar.
        if hits == 0:
            return None
        
        # Iterar sobre cada categoría posible
        for category in self.category_doc_counts:
            # Calcular Prior: P(Category)
            prior = math.log(self.category_doc_counts[category] / self.total_docs)
            
            # Calcular Likelihood: P(Description | Category)
            log_likelihood = 0
            total_words_in_category = self.category_counts[category]
            
            for token in tokens:
                # Laplace Smoothing
                word_count = self.word_counts[category].get(token, 0)
                prob_word_given_cat = (word_count + 1) / (total_words_in_category + vocab_size)
                log_likelihood += math.log(prob_word_given_cat)
            
            posterior = prior + log_likelihood
            
            if posterior > max_log_prob:
                max_log_prob = posterior
                best_category = category
        
        return best_category

def predict_category_for_user(user, description):
    """
    Helper function to create predictor, train, and predict in one go.
    """
    try:
        predictor = CategoryPredictor(user)
        predictor.train()
        return predictor.predict(description)
    except Exception as e:
        print(f"Error in lightweight ML prediction: {e}")
        return None
