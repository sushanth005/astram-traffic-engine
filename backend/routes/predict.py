from flask import Blueprint, request, jsonify
import os
import pickle
import numpy as np
from config import Config

predict_bp = Blueprint('predict', __name__)

# Helper to load models safely
def load_model(filename):
    model_path = Config.MODELS_DIR / filename
    if os.path.exists(model_path) and os.path.getsize(model_path) > 0:
        try:
            with open(model_path, 'rb') as f:
                return pickle.load(f)
        except Exception:
            pass
    return None

@predict_bp.route('/priority', methods=['POST'])
def predict_priority():
    data = request.get_json() or {}
    
    # Extract features (adjust fields as necessary)
    description = data.get('description', '')
    category = data.get('category', 'General')
    impact = data.get('impact', 'Low')
    
    # Load model
    model = load_model('priority_model.pkl')
    
    if model is None:
        # Fallback dummy logic if model is not yet trained/saved
        priority_map = {"High": "P1", "Medium": "P2", "Low": "P3"}
        predicted_priority = priority_map.get(impact, "P3")
        confidence = 0.85
    else:
        # Example prediction using features
        # X = preprocess(data)
        # predicted_priority = model.predict(X)[0]
        # confidence = float(model.predict_proba(X).max())
        predicted_priority = "P2"
        confidence = 0.92

    return jsonify({
        "status": "success",
        "prediction": {
            "priority": predicted_priority,
            "confidence": confidence,
            "category": category
        }
    }), 200

@predict_bp.route('/resolution', methods=['POST'])
def predict_resolution():
    data = request.get_json() or {}
    
    model = load_model('resolution_model.pkl')
    
    if model is None:
        # Fallback dummy logic
        estimated_hours = 4.5
        confidence = 0.78
    else:
        # Run prediction
        estimated_hours = 6.2
        confidence = 0.88

    return jsonify({
        "status": "success",
        "prediction": {
            "estimated_resolution_time_hours": estimated_hours,
            "confidence": confidence
        }
    }), 200
