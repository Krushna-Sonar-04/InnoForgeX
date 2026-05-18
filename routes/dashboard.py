from flask import Blueprint, jsonify

dashboard_bp = Blueprint("dashboard", __name__)

@dashboard_bp.route("/dashboard/stats", methods=["GET"])
def dashboard_stats():

    return jsonify({
        "total_claims": 120,
        "high_risk_claims": 15,
        "fraud_percentage": 12
    })