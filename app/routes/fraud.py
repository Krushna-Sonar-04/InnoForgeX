"""
Fraud routes — standalone fraud analysis and result retrieval.
Lets the frontend fetch fraud details separately from claim data.
"""

from flask import Blueprint, request, jsonify
from app.services.fraud_service import analyze_claim
import logging

fraud_bp = Blueprint("fraud", __name__)
logger   = logging.getLogger(__name__)


@fraud_bp.route("/analyze", methods=["POST"])
def analyze():
    """
    Analyze a claim payload directly — without storing it.
    Useful for frontend 'preview' analysis before final submission.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    # claim_id is optional here — generate a temp one
    if not data.get("claim_id"):
        import uuid
        data["claim_id"] = f"TEMP-{uuid.uuid4().hex[:6].upper()}"

    try:
        result = analyze_claim(data)
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Standalone fraud analysis failed: {e}")
        return jsonify({"error": "Analysis failed", "detail": str(e)}), 500


@fraud_bp.route("/verdict/<verdict>", methods=["GET"])
def explain_verdict(verdict):
    """
    Returns a human-readable explanation of a verdict level.
    Helps the frontend render tooltips without hardcoding copy.
    """
    verdicts = {
        "low": {
            "label":       "Low risk",
            "color":       "green",
            "description": "Claim appears legitimate. Approved for processing.",
            "action":      "approve",
        },
        "medium": {
            "label":       "Medium risk",
            "color":       "yellow",
            "description": "Some unusual patterns detected. Manual review recommended.",
            "action":      "review",
        },
        "high": {
            "label":       "High risk",
            "color":       "orange",
            "description": "Multiple fraud indicators found. Escalate to senior investigator.",
            "action":      "escalate",
        },
        "critical": {
            "label":       "Critical risk",
            "color":       "red",
            "description": "Strong fraud evidence. Reject and flag for investigation.",
            "action":      "reject",
        },
    }
    if verdict not in verdicts:
        return jsonify({"error": f"Unknown verdict '{verdict}'"}), 404
    return jsonify(verdicts[verdict]), 200