from services.risk_scoring import calculate_risk
from services.ai_summary import generate_ai_summary

def analyze_claim(data):

    risk = 0
    reasons = []

    amount = data.get("amount", 0)

    if amount > 100000:
        risk += 30
        reasons.append("High claim amount")

    if data.get("duplicate_claim"):
        risk += 40
        reasons.append("Duplicate claim detected")

    if data.get("provider_flagged"):
        risk += 20
        reasons.append("Suspicious provider")

    risk_level = calculate_risk(risk)

    ai_summary = generate_ai_summary(reasons)

    return {
        "risk_score": risk,
        "risk_level": risk_level,
        "reasons": reasons,
        "ai_summary": ai_summary
    }