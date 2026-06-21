from flask import Blueprint, jsonify
from utils.map_utils import get_mock_coordinates

map_bp = Blueprint('map', __name__)

@map_bp.route('/events', methods=['GET'])
def get_map_events():
    # Retrieve coordinates for events to plot on the UI map/heatmap
    events_data = get_mock_coordinates()
    
    return jsonify({
        "status": "success",
        "events": events_data
    }), 200
