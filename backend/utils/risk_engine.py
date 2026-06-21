# ==============================================
# RISK ENGINE — Cause-Specific Placement Logic
# ==============================================


# Per-cause configuration: each cause type gets a
# different tactical approach to barricading, police
# deployment, and diversion strategy.

CAUSE_PROFILES = {
    "accident": {
        "base_risk": 4,
        "police_base": 6,
        "barricades_base": 4,
        "diversions_base": 2,
        "strategy": "road_block",
        "description": "Block both ends of the affected road segment. "
                       "Deploy police at the barricade points and at the nearest junction. "
                       "Divert traffic to parallel roads."
    },
    "vehicle_breakdown": {
        "base_risk": 2,
        "police_base": 3,
        "barricades_base": 2,
        "diversions_base": 1,
        "strategy": "lane_closure",
        "description": "Partial lane closure around the breakdown. "
                       "Deploy police to manage merging traffic. "
                       "Single diversion sign at the nearest upstream junction."
    },
    "political rally": {
        "base_risk": 5,
        "police_base": 15,
        "barricades_base": 10,
        "diversions_base": 3,
        "strategy": "perimeter",
        "description": "Establish a full perimeter around the rally venue. "
                       "Barricades at all entry roads leading to the venue. "
                       "Police at every barricade and roaming inside perimeter. "
                       "Multiple diversion routes on all approach roads."
    },
    "protest": {
        "base_risk": 6,
        "police_base": 20,
        "barricades_base": 12,
        "diversions_base": 3,
        "strategy": "perimeter",
        "description": "High-security perimeter. Barricade all approach roads. "
                       "Rapid response police teams on standby. "
                       "Divert all through-traffic away from the protest zone."
    },
    "demonstration": {
        "base_risk": 6,
        "police_base": 20,
        "barricades_base": 12,
        "diversions_base": 3,
        "strategy": "perimeter",
        "description": "High-security perimeter. Barricade all approach roads. "
                       "Rapid response police teams on standby. "
                       "Divert all through-traffic away from the protest zone."
    },
    "road construction": {
        "base_risk": 3,
        "police_base": 4,
        "barricades_base": 6,
        "diversions_base": 2,
        "strategy": "lane_closure",
        "description": "Partial or full lane closure at construction site. "
                       "Barricades along the work zone with reflective markers. "
                       "Police at upstream junction to manage flow. "
                       "Diversion via nearest parallel road."
    },
    "construction": {
        "base_risk": 3,
        "police_base": 4,
        "barricades_base": 6,
        "diversions_base": 2,
        "strategy": "lane_closure",
        "description": "Partial or full lane closure at construction site. "
                       "Barricades along the work zone with reflective markers. "
                       "Police at upstream junction to manage flow. "
                       "Diversion via nearest parallel road."
    },
    "vip movement": {
        "base_risk": 5,
        "police_base": 15,
        "barricades_base": 8,
        "diversions_base": 3,
        "strategy": "corridor",
        "description": "Secure the VIP route corridor. "
                       "Barricades at all cross-roads along the route. "
                       "Police posted at every intersection on the route. "
                       "Divert cross-traffic to alternate roads."
    },
    "religious procession": {
        "base_risk": 4,
        "police_base": 12,
        "barricades_base": 8,
        "diversions_base": 3,
        "strategy": "corridor",
        "description": "Secure the procession route. "
                       "Rolling barricades moving with the procession. "
                       "Police escort at head and tail of procession. "
                       "Divert cross-traffic at each intersection."
    },
    "sports event": {
        "base_risk": 4,
        "police_base": 10,
        "barricades_base": 8,
        "diversions_base": 3,
        "strategy": "perimeter",
        "description": "Perimeter around the sports venue and parking areas. "
                       "Barricades on approach roads during event hours. "
                       "Police managing crowd flow at entry/exit gates. "
                       "Diversion for through-traffic around the venue."
    },
    "concert": {
        "base_risk": 4,
        "police_base": 10,
        "barricades_base": 8,
        "diversions_base": 3,
        "strategy": "perimeter",
        "description": "Perimeter around the concert venue. "
                       "Barricades on approach roads. "
                       "Police at entry points and parking. "
                       "Divert through-traffic around the venue zone."
    },
    "public gathering": {
        "base_risk": 4,
        "police_base": 10,
        "barricades_base": 8,
        "diversions_base": 3,
        "strategy": "perimeter",
        "description": "Perimeter around the gathering area. "
                       "Barricades on approach roads. "
                       "Police at entry points and parking. "
                       "Divert through-traffic around the venue zone."
    },
    "waterlogging": {
        "base_risk": 4,
        "police_base": 4,
        "barricades_base": 4,
        "diversions_base": 2,
        "strategy": "road_block",
        "description": "Block entry to the waterlogged road segment. "
                       "Barricades with warning signs at both ends. "
                       "Police to prevent vehicles from entering. "
                       "Divert all traffic to the nearest dry alternate road."
    },
    "tree fall": {
        "base_risk": 3,
        "police_base": 4,
        "barricades_base": 3,
        "diversions_base": 1,
        "strategy": "road_block",
        "description": "Block the affected road segment. "
                       "Barricades at both ends of the obstruction. "
                       "Police to manage traffic until cleared. "
                       "Divert to the nearest parallel road."
    },
}

# Fallback for unknown causes
DEFAULT_PROFILE = {
    "base_risk": 3,
    "police_base": 5,
    "barricades_base": 4,
    "diversions_base": 2,
    "strategy": "road_block",
    "description": "Standard road closure protocol. "
                   "Block the affected segment and divert traffic."
}


def _match_cause(cause_text):
    """Fuzzy-match the user's cause string to a known profile."""
    text = str(cause_text or "").lower().strip()
    for key in CAUSE_PROFILES:
        if key in text:
            return CAUSE_PROFILES[key]
    # secondary keyword matching
    keyword_map = {
        "rally": "political rally",
        "protest": "protest",
        "demonstration": "demonstration",
        "march": "protest",
        "bandh": "protest",
        "strike": "protest",
        "construct": "construction",
        "repair": "construction",
        "dig": "construction",
        "vip": "vip movement",
        "convoy": "vip movement",
        "minister": "vip movement",
        "pm visit": "vip movement",
        "procession": "religious procession",
        "festival": "religious procession",
        "ganesh": "religious procession",
        "rath": "religious procession",
        "sport": "sports event",
        "cricket": "sports event",
        "match": "sports event",
        "marathon": "sports event",
        "concert": "concert",
        "gathering": "public gathering",
        "flood": "waterlogging",
        "water": "waterlogging",
        "rain": "waterlogging",
        "tree": "tree fall",
        "branch": "tree fall",
        "breakdown": "vehicle_breakdown",
        "vehicle": "vehicle_breakdown",
        "accident": "accident",
        "collision": "accident",
        "crash": "accident",
        "hit": "accident",
    }
    for keyword, profile_key in keyword_map.items():
        if keyword in text:
            return CAUSE_PROFILES[profile_key]
    return DEFAULT_PROFILE


def calculate_risk(event, hotspot_count):
    """Calculate risk score, resource needs, and placement strategy."""
    cause = event.get("event_cause", "")
    profile = _match_cause(cause)

    risk_score = profile["base_risk"]

    # Road closure increases risk
    if event.get("road_closure", False):
        risk_score += 3

    # Hotspot density increases risk
    if hotspot_count > 1000:
        risk_score += 3
    elif hotspot_count > 500:
        risk_score += 2
    else:
        risk_score += 1

    # Planned events get a slight bump (more predictable but larger)
    if event.get("event_type", "") == "planned":
        risk_score += 1

    # Cap at 13
    risk_score = min(risk_score, 13)

    # Determine risk level
    if risk_score <= 4:
        level = "LOW"
    elif risk_score <= 7:
        level = "MEDIUM"
    else:
        level = "HIGH"

    # Scale resources based on risk
    risk_multiplier = 1.0
    if level == "MEDIUM":
        risk_multiplier = 1.3
    elif level == "HIGH":
        risk_multiplier = 1.6

    police = int(profile["police_base"] * risk_multiplier)
    barricades = int(profile["barricades_base"] * risk_multiplier)
    diversions = profile["diversions_base"]

    return {
        "risk_score": risk_score,
        "risk_level": level,
        "police_required": police,
        "barricades_required": barricades,
        "diversions": diversions,
        "placement_strategy": profile["strategy"],
        "placement_description": profile["description"],
    }