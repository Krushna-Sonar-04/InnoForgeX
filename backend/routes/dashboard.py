from flask import Blueprint, jsonify

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
def dashboard_stats():
    return jsonify({
        "total_claims": 120,
        "high_risk_claims": 15,
        "fraud_percentage": 12
    })

@dashboard_bp.route("/analytics/fraud-summary", methods=["GET"])
def fraud_summary():
    # Mock data to keep the frontend running smoothly
    return jsonify({
        "total_claims": 915,
        "flagged_claims": 85,
        "fraud_rate": 9.3,
        "avg_risk": 34.2,
        "trends": [
            {"day": "Mon", "amount": 800, "flagged": 15},
            {"day": "Tue", "amount": 950, "flagged": 20},
            {"day": "Wed", "amount": 1200, "flagged": 35},
            {"day": "Thu", "amount": 850, "flagged": 18},
            {"day": "Fri", "amount": 1050, "flagged": 25},
            {"day": "Sat", "amount": 400, "flagged": 5},
            {"day": "Sun", "amount": 300, "flagged": 2}
        ]
    })