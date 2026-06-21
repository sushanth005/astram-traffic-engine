import os
import pickle
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from config import Config

def train_model():
    print("Training Resolution Model...")
    
    data_path = Config.DATA_DIR / 'Astram_event_data.csv'
    model_path = Config.MODELS_DIR / 'resolution_model.pkl'
    
    os.makedirs(Config.MODELS_DIR, exist_ok=True)
    
    if not os.path.exists(data_path):
        print(f"Dataset not found at {data_path}. Creating fallback dummy model.")
        dummy_vectorizer = TfidfVectorizer()
        dummy_regressor = RandomForestRegressor(n_estimators=10)
        pipeline = Pipeline([
            ('vectorizer', dummy_vectorizer),
            ('regressor', dummy_regressor)
        ])
        
        texts = ["Server crashed", "Reset password request", "Database slow response", "Low disk space warning"]
        times = [12.5, 0.5, 4.0, 2.0] # hours
        pipeline.fit(texts, times)
    else:
        df = pd.read_csv(data_path)
        # Expected columns: 'description', 'resolution_time'
        texts = df['description'].fillna('').tolist()
        times = df['resolution_time'].tolist()
        
        pipeline = Pipeline([
            ('vectorizer', TfidfVectorizer(max_features=5000)),
            ('regressor', RandomForestRegressor(n_estimators=100, random_state=42))
        ])
        pipeline.fit(texts, times)
        
    with open(model_path, 'wb') as f:
        pickle.dump(pipeline, f)
        
    print(f"Resolution Model trained and saved to {model_path}")

if __name__ == '__main__':
    train_model()
