import os
import sys

import joblib
import pandas as pd

from utils.embedder import get_embedding


# ======================================
# PATH FIX
# ======================================

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, ".."))
sys.path.append(project_root)


# ======================================
# IMPORTS
# ======================================

from utils.preprocessing import preprocess
from utils.groq_utils import generate_recommendation
from utils.risk_engine import calculate_risk


# ======================================
# LOAD MODELS
# ======================================

print("\nLoading Similarity Engine...")
similarity_model = joblib.load(
    os.path.join(project_root, "models", "similarity_engine.pkl")
)
print("Loaded.")

print("\nEmbedding Model: HF Inference API (all-MiniLM-L6-v2)")

print("\nLoading Dataset...")
df = preprocess()
print("Loaded:", df.shape)

print("\nLoading Hotspots...")
hotspots = pd.read_csv(
    os.path.join(project_root, "models", "hotspots.csv")
)
print("Loaded:", hotspots.shape)


# ======================================
# LOCATION DETECTION
# ======================================

def detect_zone_corridor(query):
    query_text = str(query or "").strip()
    if not query_text:
        return {"zone": "Unknown", "corridor": "Unknown", "match": "none"}

    text = query_text.lower()
    best = {"score": 0, "zone": "Unknown", "corridor": "Unknown", "match": "none"}

    for value in df["corridor"].dropna().unique():
        if not isinstance(value, str):
            continue
        low = value.lower()
        if low and low in text:
            return {"zone": "Unknown", "corridor": value, "match": "corridor"}

    for value in df["zone"].dropna().unique():
        if not isinstance(value, str):
            continue
        low = value.lower()
        if low and low in text:
            return {"zone": value, "corridor": "Unknown", "match": "zone"}

    for col in ["address", "end_address", "route_path", "description"]:
        if col not in df.columns:
            continue
        subset = df[[col, "zone", "corridor"]].dropna(subset=[col])
        for _, row in subset.iterrows():
            cell = str(row[col]).lower()
            if text in cell:
                return {
                    "zone": row.get("zone", "Unknown") or "Unknown",
                    "corridor": row.get("corridor", "Unknown") or "Unknown",
                    "match": f"address:{col}"
                }
            score = sum(1 for token in text.split() if token and token in cell)
            if score > best["score"]:
                best.update({
                    "score": score,
                    "zone": row.get("zone", "Unknown") or "Unknown",
                    "corridor": row.get("corridor", "Unknown") or "Unknown",
                    "match": f"partial:{col}"
                })

    if best["score"] > 0:
        return best

    return {"zone": "Unknown", "corridor": "Unknown", "match": "none"}


# ======================================
# EVENT TWIN TEXT
# ======================================

def create_event_text(event_type, event_cause, location, road_closure):
    return f"Event Type: {event_type} Event Cause: {event_cause} Location: {location} Road Closure: {road_closure}"


# ======================================
# EXTRACT NEARBY POLICE STATION
# ======================================

def find_nearby_police_station(similar_events):
    """Extract the most common police station from similar historical events."""
    if "police_station" not in similar_events.columns:
        return "Unknown"
    stations = similar_events["police_station"].dropna()
    stations = stations[stations != "Unknown"]
    if stations.empty:
        return "Unknown"
    return stations.mode().iloc[0]


# ======================================
# SIMULATE EVENT
# ======================================

def simulate_event(
    event_type,
    event_cause,
    location,
    road_closure,
    start_point=None,
    end_point=None,
    radius_meters=None,
    zone=None,
    corridor=None,
    start_time=None,
    end_time=None,
    expected_crowd=None,
):
    # --------------------------------
    # CREATE QUERY
    # --------------------------------
    query = create_event_text(event_type, event_cause, location, road_closure)

    # --------------------------------
    # EMBEDDING
    # --------------------------------
    embedding = get_embedding(query).reshape(1, -1)

    # --------------------------------
    # FIND SIMILAR EVENTS
    # --------------------------------
    distances, indices = similarity_model.kneighbors(embedding, n_neighbors=5)
    similar_events = df.iloc[indices[0]]
    similarity_score = float(1 - distances[0][0])

    # --------------------------------
    # EXTRACT CONTEXT FROM SIMILAR EVENTS
    # --------------------------------
    nearby_police_station = find_nearby_police_station(similar_events)

    # --------------------------------
    # HOTSPOTS
    # --------------------------------
    hotspot_count = int(hotspots[hotspots["cluster"] != -1].shape[0])

    # --------------------------------
    # RISK ENGINE (cause-specific)
    # --------------------------------
    risk = calculate_risk(
        {
            "event_type": event_type,
            "event_cause": event_cause,
            "road_closure": road_closure,
        },
        hotspot_count
    )

    # --------------------------------
    # CONGESTION ESTIMATION (dynamic)
    # --------------------------------
    base_congestion = risk["risk_score"] * 5
    if risk["placement_strategy"] == "perimeter":
        base_congestion += 15
    elif risk["placement_strategy"] == "corridor":
        base_congestion += 10
    expected_congestion_minutes = int(base_congestion + hotspot_count * 0.003)

    # --------------------------------
    # CLEARANCE TIME (dynamic)
    # --------------------------------
    if start_time and end_time:
        estimated_clearance_time = end_time
    elif risk["risk_level"] == "HIGH":
        estimated_clearance_time = "3-4 hours"
    elif risk["risk_level"] == "MEDIUM":
        estimated_clearance_time = "1-2 hours"
    else:
        estimated_clearance_time = "30-60 minutes"

    # --------------------------------
    # CONFIDENCE
    # --------------------------------
    confidence_score = round(min(0.55 + similarity_score * 0.4, 0.98), 2)

    # --------------------------------
    # GROQ RECOMMENDATION (enhanced)
    # --------------------------------
    groq_output = generate_recommendation(
        event_type,
        event_cause,
        location,
        similarity_score,
        hotspot_count,
        road_closure,
        placement_strategy=risk["placement_strategy"],
        placement_description=risk["placement_description"],
        police_required=risk["police_required"],
        barricades_required=risk["barricades_required"],
        diversions=risk["diversions"],
        nearby_police_station=nearby_police_station,
        start_time=start_time,
        end_time=end_time,
        expected_crowd=expected_crowd,
    )

    detected = detect_zone_corridor(location)
    if zone:
        detected["zone"] = zone
    if corridor:
        detected["corridor"] = corridor

    # --------------------------------
    # RESULT
    # --------------------------------
    result = {
        # Similarity
        "similarity_score": round(similarity_score, 3),

        # Risk
        "risk_score": risk["risk_score"],
        "risk_level": risk["risk_level"],

        # Resources
        "police_required": risk["police_required"],
        "barricades_required": risk["barricades_required"],
        "diversions": risk["diversions"],

        # Placement strategy
        "placement_strategy": risk["placement_strategy"],
        "placement_description": risk["placement_description"],

        # Metrics
        "expected_congestion_minutes": expected_congestion_minutes,
        "estimated_clearance_time": estimated_clearance_time,
        "confidence_score": confidence_score,

        # Hotspots
        "hotspots": hotspot_count,

        # Nearby services (from historical data)
        "nearby_police_station": nearby_police_station,

        # AI Recommendation
        "recommendation": groq_output,

        "detected_zone": detected.get("zone", "Unknown"),
        "detected_corridor": detected.get("corridor", "Unknown"),
        "detection_match": detected.get("match", "none"),

        "start_point": start_point,
        "end_point": end_point,
        "radius_meters": radius_meters,
    }

    return result