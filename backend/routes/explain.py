from flask import Blueprint, request, jsonify
from utils.groq_utils import get_explanation_from_llm

explain_bp = Blueprint('explain', __name__)

@explain_bp.route('/prediction', methods=['POST'])
def explain_prediction():
    data = request.get_json() or {}
    
    event_details = data.get('event_details', {})
    prediction_results = data.get('prediction_results', {})
    
    # Try getting explanation using Groq LLM if API key is provided
    try:
        explanation = get_explanation_from_llm(event_details, prediction_results)
    except Exception as e:
        explanation = (
            f"The prediction of priority {prediction_results.get('priority', 'N/A')} "
            f"was driven primarily by impact level: '{event_details.get('impact', 'N/A')}' "
            f"and description keywords."
        )
        
    return jsonify({
        "status": "success",
        "explanation": explanation
    }), 200
