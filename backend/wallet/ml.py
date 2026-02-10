import pandas as pd
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline
from .models import Transaction

class CategoryPredictor:
    def __init__(self, user):
        self.user = user
        self.pipeline = None
        self.is_trained = False

    def train(self):
        """
        Entrena el modelo usando el historial de transacciones del usuario.
        """
        # 1. Obtener transacciones del usuario
        transactions = Transaction.objects.filter(user=self.user).values('description', 'category')
        
        # 2. Convertir a DataFrame
        df = pd.DataFrame(list(transactions))
        
        # 3. Validar si hay suficientes datos
        if df.empty or len(df) < 5:  # Mínimo 5 transacciones para intentar predecir
            self.is_trained = False
            return
        
        # 4. Limpiar datos (eliminar sin categoría o sin descripción)
        df = df.dropna(subset=['description', 'category'])
        df = df[df['description'].str.strip() != '']
        df = df[df['category'].str.strip() != '']

        if len(df) < 5:
            self.is_trained = False
            return

        # 5. Crear Pipeline (Bag of Words + Naive Bayes)
        # CountVectorizer: Convierte texto en matriz de conteo de palabras
        # MultinomialNB: Clasificador rápido y efectivo para texto corto
        self.pipeline = make_pipeline(
            CountVectorizer(stop_words=None, strip_accents='unicode'), 
            MultinomialNB()
        )

        # 6. Entrenar
        try:
            self.pipeline.fit(df['description'], df['category'])
            self.is_trained = True
        except Exception as e:
            print(f"Error training ML model for user {self.user.id}: {e}")
            self.is_trained = False

    def predict(self, description):
        """
        Predice la categoría para una descripción dada.
        Retorna la categoría predicha o None si no se pudo predecir.
        """
        if not self.is_trained or not description:
            return None
        
        try:
            # Predecir
            prediction = self.pipeline.predict([description])[0]
            
            # Obtener probabilidad/confianza (opcional, para filtrar predicciones débiles)
            # probabilities = self.pipeline.predict_proba([description])
            # max_prob = max(probabilities[0])
            # if max_prob < 0.4: return None 
            
            return prediction
        except Exception as e:
            print(f"Error predicting category: {e}")
            return None

def predict_category_for_user(user, description):
    """
    Helper function to create predictor, train, and predict in one go.
    In a real production app, we would cache the trained model.
    """
    predictor = CategoryPredictor(user)
    predictor.train()
    return predictor.predict(description)
