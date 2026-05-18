from flask import Blueprint, jsonify

fraud_bp = Blueprint("fraud", __name__)

@fraud_bp.route("/fraud/high-risk", methods=["GET"])
def high_risk_claims():

    return jsonify({
        "message": "High risk claims endpoint working"
    })