import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'astram-eventtwin-secret-dev-key')
    DEBUG = os.environ.get('DEBUG', 'True').lower() == 'true'
    
    # Paths
    MODELS_DIR = BASE_DIR / 'models'
    DATA_DIR = BASE_DIR / 'data'
    
    # Third-party integrations
    GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')

class ProductionConfig(Config):
    DEBUG = False

class DevelopmentConfig(Config):
    DEBUG = True
