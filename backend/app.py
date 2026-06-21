from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.simulator import simulate_event, detect_zone_corridor


# ==========================================
# FASTAPI APP
# ==========================================

app = FastAPI(
    title="ASTRAM EventTwin",
    version="2.0.0",
    description="AI-powered Event Digital Twin for Bengaluru Traffic Police"
)


# ==========================================
# CORS
# ==========================================
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://astram-traffic-engine.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app", # To support preview deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def home():
    return {"message": "ASTRAM EventTwin Running 🚀"}


# ==========================================
# EVENT SIMULATION
# ==========================================

@app.post("/simulate")
def simulate(payload: dict):
    try:
        result = simulate_event(
            event_type=payload.get("event_type", "planned"),
            event_cause=payload.get("event_cause", "Political Rally"),
            location=payload.get("location", "MG Road"),
            road_closure=payload.get("road_closure", False),
            start_point=payload.get("start_point", None),
            end_point=payload.get("end_point", None),
            radius_meters=payload.get("radius_meters", None),
            zone=payload.get("zone", None),
            corridor=payload.get("corridor", None),
            start_time=payload.get("start_time", None),
            end_time=payload.get("end_time", None),
            expected_crowd=payload.get("expected_crowd", None),
        )
        return result
    except Exception as e:
        return {"status": "error", "message": str(e)}


# ==========================================
# LOCATION DETECTION
# ==========================================

@app.post("/detect-location")
def detect_location(payload: dict):
    query = payload.get("query", "")
    return detect_zone_corridor(query)


# ==========================================
# HEALTH CHECK
# ==========================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "backend": "running",
        "service": "ASTRAM EventTwin"
    }