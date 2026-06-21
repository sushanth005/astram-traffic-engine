import random

def get_mock_coordinates(base_lat=40.7128, base_lon=-74.0060, count=10):
    """Generate list of mock coordinates for mapping/heatmap relative to base location."""
    events = []
    categories = ["Network", "Security", "Hardware", "Database"]
    priorities = ["P1", "P2", "P3"]
    
    for i in range(count):
        # Add random offset
        lat = base_lat + random.uniform(-0.05, 0.05)
        lon = base_lon + random.uniform(-0.05, 0.05)
        intensity = random.uniform(0.2, 1.0)
        
        events.append({
            "id": f"evt-{1000 + i}",
            "lat": round(lat, 6),
            "lon": round(lon, 6),
            "intensity": round(intensity, 2),
            "category": random.choice(categories),
            "priority": random.choice(priorities),
            "description": f"Incident report {1000 + i}"
        })
        
    return events
