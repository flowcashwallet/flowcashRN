import re
import math
from collections import defaultdict, Counter
from .models import Transaction

class CategoryPredictor:
    def __init__(self, user):
        self.user = user
        # Estructuras de datos para Naive Bayes
        # vocab: Set de todas las palabras únicas encontradas
        self.vocab = set()
        # word_counts: {categoria: {palabra: frecuencia}}
        self.word_counts = defaultdict(lambda: defaultdict(int))
        # category_counts: {categoria: total_palabras}
        self.category_counts = defaultdict(int)
        # category_doc_counts: {categoria: numero_de_transacciones}
        self.category_doc_counts = defaultdict(int)
        # total_docs: numero total de transacciones
        self.total_docs = 0
        self.is_trained = False

    def _tokenize(self, text):
        """
        Tokeniza el texto: minúsculas, elimina puntuación, split por espacios.
        """
        if not text:
            return []
        text = text.lower()
        # Reemplazar todo lo que no sea alfanumérico con espacios
        text = re.sub(r'[^a-z0-9\s]', ' ', text)
        # Split y eliminar espacios vacíos
        tokens = [t for t in text.split() if len(t) > 1] # Ignorar letras sueltas
        return tokens

    def train(self):
        """
        Entrena el modelo usando el historial de transacciones del usuario.
        Implementación Pure Python de Naive Bayes (Multinomial).
        """
        # 1. Obtener transacciones del usuario (optimizando consulta)
        transactions = Transaction.objects.filter(user=self.user).exclude(
            description__isnull=True
        ).exclude(
            description__exact=''
        ).exclude(
            category__isnull=True
        ).values('description', 'category')
        
        # Validar si hay suficientes datos
        count = len(transactions)
        if count < 5:
            self.is_trained = False
            return
        
        self.total_docs = count
        
        # 2. Construir frecuencias
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
                
        self.is_trained = True

    def predict(self, description):
        """
        Predice la categoría para una descripción dada.
        Retorna la categoría predicha o None.
        """
        if not self.is_trained or not description:
            return None
        
        tokens = self._tokenize(description)
        if not tokens:
            return None
            
        best_category = None
        max_log_prob = -float('inf')
        
        # Vocab size para Laplace smoothing
        vocab_size = len(self.vocab)
        
        # Iterar sobre cada categoría posible
        for category in self.category_doc_counts:
            # Calcular Prior: P(Category)
            # Log Probability para evitar underflow
            # P(C) = doc_count[C] / total_docs
            prior = math.log(self.category_doc_counts[category] / self.total_docs)
            
            # Calcular Likelihood: P(Description | Category)
            # Sum(log(P(word | Category)))
            log_likelihood = 0
            
            total_words_in_category = self.category_counts[category]
            
            for token in tokens:
                # Laplace Smoothing: (count + 1) / (total_words + vocab_size)
                # Si la palabra no está en el vocabulario global, se ignora en este modelo simple
                # o se trata como 'unknown' con count 0
                word_count = self.word_counts[category].get(token, 0)
                
                # P(w|C)
                prob_word_given_cat = (word_count + 1) / (total_words_in_category + vocab_size)
                log_likelihood += math.log(prob_word_given_cat)
            
            # Posterior no normalizado = Prior + Likelihood
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
