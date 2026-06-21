import os
import json

from groq import Groq
from dotenv import load_dotenv


load_dotenv()

api_key = os.getenv("GROQ_API_KEY")

if api_key is None or api_key.strip() == "":
    raise Exception("\nGROQ_API_KEY not found in .env")

client = Groq(api_key=api_key)


def generate_recommendation(
    event_type,
    event_cause,
    location,
    similarity_score,
    hotspot_count,
    road_closure,
    placement_strategy="road_block",
    placement_description="",
    police_required=0,
    barricades_required=0,
    diversions=0,
    nearby_police_station="Unknown",
    start_time=None,
    end_time=None,
    expected_crowd=None,
):
    prompt = f"""You are an AI Traffic Management Expert working for Bengaluru Traffic Police.
You must provide a tactical deployment plan for on-ground officers.

EVENT DETAILS:
- Event Type: {event_type}
- Event Cause: {event_cause}
- Location: {location}, Bengaluru
- Road Closure Required: {road_closure}
- Historical Similarity Score: {similarity_score:.2f}
- Nearby Hotspot Density: {hotspot_count}
- Nearest Police Station: {nearby_police_station}
{f'- Event Start Time: {start_time}' if start_time else ''}
{f'- Event End Time: {end_time}' if end_time else ''}
{f'- Expected Crowd Size: {expected_crowd}' if expected_crowd else ''}

RESOURCE ALLOCATION (from risk engine):
- Police Officers: {police_required}
- Barricades: {barricades_required}
- Diversion Routes: {diversions}
- Placement Strategy: {placement_strategy}
- Strategy Detail: {placement_description}

INSTRUCTIONS:
Generate a structured response in EXACTLY this format. Use real Bengaluru road names near {location}.

Respond with these sections using bullet points (* prefix):

* Risk Level: [HIGH/MEDIUM/LOW] ([score]/13) — [one line reason]
* Police Deployment: [number] officers — [describe where exactly to post them using real road/junction names near {location}]
* Barricade Placement: [number] barricades — [describe exact placement using real road names, e.g. "Block {location} at both ends near [junction name]"]
* Diversion Strategy: Divert traffic from {location} to [list 2-3 real alternate roads near {location} in Bengaluru]
* Nearby Emergency Services: Nearest police station: [name]. Nearest hospital: [name]. Nearest fire station: [name if known].
* Estimated Impact Duration: [time estimate based on event type]
* Short Explanation: [2-3 sentence summary of the situation and recommended action plan]

CRITICAL: Use REAL road names and junction names near {location} in Bengaluru. Do NOT use generic placeholders.
"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a senior traffic management AI for Bengaluru Traffic Police. "
                               "Always use real Bengaluru road names, junctions, and landmarks. "
                               "Be specific and actionable. Your output will be shown to police officers on duty."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.3,
            max_tokens=800,
        )

        answer = response.choices[0].message.content
        return answer

    except Exception as e:
        return "Groq Error:\n" + str(e)