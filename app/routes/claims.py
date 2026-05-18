"""
Claims routes — submit, list, and retrieve claims.
These are the primary endpoints the React frontend talks to.
"""

from flask import Blueprint, request, jsonify, current_app
from app.services.fraud_service import analyze_claim
import logging
import uuid
from datetime import datetime


claims_bp = Blueprint("claims", __name__)
logger    = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# In-memory store — your teammate will replace this with DB calls
# Using a simple dict keyed by claim_id
# ---------------------------------------------------------------------------
_claims_store: dict = {}


@claims_bp.route("/submit", methods=["POST"])
def submit_claim():
    """
    Submit a new claim and trigger fraud analysis.

    Request body (JSON):
    {
        "patient_id":        "P001",
        "patient_age":       45,
        "patient_gender":    "M",
        "provider_id":       "DR002",
        "provider_type":     "hospital",
        "provider_specialty":"orthopedics",
        "claim_amount":      12500.00,
        "service_date":      "2024-05-10",
        "discharge_date":    "2024-05-12",
        "diagnosis_codes":   ["M16.11", "Z96.641"],
        "procedure_codes":   ["27447"],
        "place_of_service":  "inpatient",
        "insurance_type":    "Medicare",
        "notes":             "Hip replacement surgery"
    }
    """
    data = request.get_json(silent=True)

    if not data:
        return jsonify({"error": "Request body must be valid JSON"}), 400

    # Basic required field check
    required = ["patient_id", "provider_id", "claim_amount", "service_date"]
    missing  = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({
            "error":   "Missing required fields",
            "missing": missing
        }), 422

    # Assign a server-side claim ID (teammate will use DB auto-increment)
    claim_id = data.get("claim_id") or f"CLM-{uuid.uuid4().hex[:8].upper()}"
    data["claim_id"] = claim_id

    # Save raw claim immediately with pending status
    claim_record = {
        **data,
        "status":       "pending",
        "submitted_at": datetime.utcnow().isoformat() + "Z",
        "fraud_result": None,
    }
    _claims_store[claim_id] = claim_record

    # Run fraud analysis pipeline
    try:
        fraud_result = analyze_claim(data)
        claim_record["fraud_result"] = fraud_result
        claim_record["status"] = _verdict_to_status(
            fraud_result.get("final_verdict", "medium")
        )
    except Exception as e:
        logger.error(f"Fraud analysis error for {claim_id}: {e}")
        claim_record["status"]       = "error"
        claim_record["fraud_result"] = {"error": str(e)}

    _claims_store[claim_id] = claim_record

    return jsonify({
        "success":   True,
        "claim_id":  claim_id,
        "status":    claim_record["status"],
        "fraud_result": claim_record["fraud_result"],
    }), 201


@claims_bp.route("/", methods=["GET"])
def list_claims():
    """
    List all submitted claims with summary info.
    Supports ?status=flagged&limit=20&offset=0 query params.
    """
    status_filter = request.args.get("status")
    limit  = int(request.args.get("limit",  20))
    offset = int(request.args.get("offset",  0))

    claims = list(_claims_store.values())

    if status_filter:
        claims = [c for c in claims if c.get("status") == status_filter]

    # Sort newest first
    claims.sort(key=lambda c: c.get("submitted_at", ""), reverse=True)

    total   = len(claims)
    paged   = claims[offset: offset + limit]
    summary = [_claim_summary(c) for c in paged]

    return jsonify({
        "claims": summary,
        "total":  total,
        "limit":  limit,
        "offset": offset,
    }), 200


@claims_bp.route("/<claim_id>", methods=["GET"])
def get_claim(claim_id):
    """Get full details of a single claim including fraud analysis."""
    claim = _claims_store.get(claim_id)
    if not claim:
        return jsonify({"error": f"Claim '{claim_id}' not found"}), 404
    return jsonify(claim), 200


@claims_bp.route("/<claim_id>/reanalyze", methods=["POST"])
def reanalyze_claim(claim_id):
    """Re-run fraud analysis on an existing claim (useful for testing)."""
    claim = _claims_store.get(claim_id)
    if not claim:
        return jsonify({"error": f"Claim '{claim_id}' not found"}), 404

    try:
        fraud_result = analyze_claim(claim)
        claim["fraud_result"] = fraud_result
        claim["status"]       = _verdict_to_status(
            fraud_result.get("final_verdict", "medium")
        )
        _claims_store[claim_id] = claim
        return jsonify({"success": True, "fraud_result": fraud_result}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Helpers ───────────────────────────────────────────────────────────────────

def _claim_summary(claim: dict) -> dict:
    """Lightweight summary for list view — avoids sending full fraud result."""
    fr = claim.get("fraud_result") or {}
    return {
        "claim_id":         claim.get("claim_id"),
        "patient_id":       claim.get("patient_id"),
        "provider_id":      claim.get("provider_id"),
        "claim_amount":     claim.get("claim_amount"),
        "service_date":     claim.get("service_date"),
        "status":           claim.get("status"),
        "submitted_at":     claim.get("submitted_at"),
        "risk_score":       fr.get("final_risk_score"),
        "verdict":          fr.get("final_verdict"),
        "recommended_action": fr.get("recommended_action"),
    }


def _verdict_to_status(verdict: str) -> str:
    return {
        "low":      "approved",
        "medium":   "under_review",
        "high":     "flagged",
        "critical": "rejected",
    }.get(verdict, "under_review")