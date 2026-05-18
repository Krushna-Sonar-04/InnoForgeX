from services.anomaly_detector import detect_anomalies
from services.risk_scoring import calculate_risk
from services.ai_summary import generate_ai_summary

def analyze_claim(data, cursor=None):
    reasons = detect_anomalies(data, cursor)
    
    risk = 0
    # Map reasons to specific weighted risk score contributions
    for reason in reasons:
        if "Extreme billing outlier" in reason:
            risk += 95
        elif "Critical billing outlier" in reason:
            risk += 75
        elif "High billing outlier" in reason:
            risk += 50
        elif "E&M upcoding mismatch" in reason:
            risk += 45
        elif "Severe clinical procedure-diagnosis code mismatch" in reason:
            risk += 60
        elif "Duplicate claim detected" in reason:
            risk += 55
        elif "Historical provider fraud alert" in reason:
            risk += 35
        else:
            risk += 20

    # Clean cap: Base risk is 10 for completely clean claims, and max capped at 99
    if not reasons:
        risk = 10
    else:
        risk = min(99, max(15, risk))

    risk_level = calculate_risk(risk)
    ai_summary = generate_ai_summary(reasons)

    return {
        "risk_score": risk,
        "risk_level": risk_level,
        "reasons": reasons,
        "ai_summary": ai_summary
    }