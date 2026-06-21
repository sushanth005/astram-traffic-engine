import os
import pickle
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from config import Config

def train_model():
    print("Training Priority Model...")
    
    # Path setup
    data_path = Config.DATA_DIR / 'Astram_event_data.csv'
    model_path = Config.MODELS_DIR / 'priority_model.pkl'
    
    # Ensure directories exist
    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Creating fallback dummy model.")
        # Create a basic pipeline that returns a dummy class
        dummy_vectorizer = TfidfVectorizer()
        dummy_classifier = RandomForestClassifier(n_estimators=10)
        pipeline = Pipeline([
            ('vectorizer', dummy_vectorizer),
            ('classifier', dummy_classifier)
        ])
        
        # Fit on mock data
        texts = ["Server crashed", "Reset password request", "Database slow response", "Low disk space warning"]
        labels = ["P1", "P3", "P2", "P3"]
        pipeline.fit(texts, labels)
    else:
        # Load real data
        df = pd.read_csv(data_path)
        # Expected columns: 'description', 'priority'
        texts = df['description'].fillna('').tolist()
        labels = df['priority'].tolist()
        
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=5000)),
            ('classifier', RandomForestClassifier(n_estimators=100, random_state=42))
        ])
        pipeline.fit(texts, labels)
        
    # Save the trained pipeline
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)
        
    print(f"Priority Model trained and saved to {model_path}")

if __name__ == '__main__':
    train_model()
