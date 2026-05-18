"""
Dashboard routes — aggregate statistics for the frontend dashboard.
All stats computed from in-memory store (teammate plugs in DB queries).
"""

from flask import Blueprint, jsonify
from app.routes.claims import _claims_store
import logging

dashboard_bp = Blueprint("dashboard", __name__)
logger       = logging.getLogger(__name__)


@dashboard_bp.route("/stats", methods=["GET"])
def get_stats():
    """
    Returns high-level stats for the dashboard.

    Response:
    {
        "total_claims":      int,
        "approved":          int,
        "flagged":           int,
        "rejected":          int,
        "under_review":      int,
        "avg_risk_score":    float,
        "high_risk_count":   int,
        "fraud_rate_pct":    float,
        "pipeline_health":   str,
    }
    """
    claims = list(_claims_store.values())
    total  = len(claims)

    if total == 0:
        return jsonify(_empty_stats()), 200

    status_counts = _count_by_key(claims, "status")
    risk_scores   = [
        c["fraud_result"]["final_risk_score"]
        for c in claims
        if c.get("fraud_result") and c["fraud_result"].get("final_risk_score") is not None
    ]

    avg_score    = round(sum(risk_scores) / len(risk_scores), 1) if risk_scores else 0
    high_risk    = sum(1 for s in risk_scores if s >= 70)
    fraud_rate   = round((high_risk / total) * 100, 1) if total else 0

    return jsonify({
        "total_claims":    total,
        "approved":        status_counts.get("approved",     0),
        "flagged":         status_counts.get("flagged",       0),
        "rejected":        status_counts.get("rejected",      0),
        "under_review":    status_counts.get("under_review",  0),
        "avg_risk_score":  avg_score,
        "high_risk_count": high_risk,
        "fraud_rate_pct":  fraud_rate,
        "pipeline_health": "operational",
    }), 200


@dashboard_bp.route("/recent", methods=["GET"])
def recent_claims():
    """Last 5 claims with fraud summary — for a dashboard feed."""
    claims = sorted(
        _claims_store.values(),
        key=lambda c: c.get("submitted_at", ""),
        reverse=True
    )[:5]

    feed = []
    for c in claims:
        fr = c.get("fraud_result") or {}
        feed.append({
            "claim_id":    c.get("claim_id"),
            "patient_id":  c.get("patient_id"),
            "amount":      c.get("claim_amount"),
            "status":      c.get("status"),
            "risk_score":  fr.get("final_risk_score"),
            "verdict":     fr.get("final_verdict"),
            "submitted_at": c.get("submitted_at"),
        })

    return jsonify({"recent": feed}), 200


@dashboard_bp.route("/risk-distribution", methods=["GET"])
def risk_distribution():
    """Breakdown of claims by risk band — for charts."""
    claims = list(_claims_store.values())
    bands  = {"low": 0, "medium": 0, "high": 0, "critical": 0}

    for c in claims:
        fr = c.get("fraud_result") or {}
        v  = fr.get("final_verdict")
        if v in bands:
            bands[v] += 1

    return jsonify({"distribution": bands, "total": len(claims)}), 200


# ── Helpers ───────────────────────────────────────────────────────────────────

def _count_by_key(items: list, key: str) -> dict:
    counts = {}
    for item in items:
        val = item.get(key, "unknown")
        counts[val] = counts.get(val, 0) + 1
    return counts


def _empty_stats() -> dict:
    return {
        "total_claims": 0, "approved": 0, "flagged": 0,
        "rejected": 0, "under_review": 0, "avg_risk_score": 0,
        "high_risk_count": 0, "fraud_rate_pct": 0,
        "pipeline_health": "operational",
    }