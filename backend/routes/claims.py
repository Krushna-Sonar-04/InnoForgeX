from flask import Blueprint, request, jsonify

from database.db import mysql
from services.fraud_engine import analyze_claim

claims_bp = Blueprint("claims", __name__)

# Maps reason keywords → (severity label, weight %) — mirrors fraud_engine.py weights
def _reason_to_severity_weight(reason: str):
    r = reason.lower()
    if "extreme billing outlier" in r:
        return "HIGH", 95
    if "critical billing outlier" in r:
        return "HIGH", 75
    if "high billing outlier" in r:
        return "HIGH", 50
    if "e&m upcoding" in r or "evaluation and management" in r:
        return "MEDIUM", 45
    if "severe clinical procedure-diagnosis" in r:
        return "HIGH", 60
    if "duplicate claim" in r:
        return "HIGH", 55
    if "historical provider fraud" in r:
        return "MEDIUM", 35
    return "LOW", 20


@claims_bp.route("/claims", methods=["POST"])
def create_claim():

    try:

        data = request.json

        # Validate request body
        if not data:
            return jsonify({
                "success": False,
                "message": "No data provided"
            }), 400

        cursor = mysql.connection.cursor()

        # Run fraud analysis
        result = analyze_claim(data, cursor)

        # Insert into claims table
        insert_claim_query = """

        INSERT INTO claims (

            patient_id,
            patient_name,
            provider_id,
            provider_name,
            amount,
            diagnosis,
            procedure_code,
            risk_score,
            risk_level,
            status,
            ai_summary

        )

        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)

        """

        claim_values = (

            data.get("patient_id"),
            data.get("patient_name"),
            data.get("provider_id"),
            data.get("provider_name"),
            data.get("amount"),
            data.get("diagnosis"),
            data.get("procedure_code"),
            result.get("risk_score"),
            result.get("risk_level"),
            "UNDER_REVIEW",
            result.get("ai_summary")

        )

        cursor.execute(insert_claim_query, claim_values)

        mysql.connection.commit()

        # Get inserted claim ID
        claim_id = cursor.lastrowid

        # Insert fraud reasons into fraud_flags table
        for reason in result.get("reasons", []):

            severity, weight = _reason_to_severity_weight(reason)

            insert_flag_query = """

            INSERT INTO fraud_flags (

                claim_id,
                reason,
                severity,
                weight

            )

            VALUES (%s,%s,%s,%s)

            """

            flag_values = (

                claim_id,
                reason,
                severity,
                weight

            )

            cursor.execute(insert_flag_query, flag_values)

        mysql.connection.commit()

        cursor.close()

        return jsonify({
            "success": True,
            "message": "Claim inserted successfully",
            "claim_id": claim_id,
            "fraud_analysis": result
        }), 201

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@claims_bp.route("/claims", methods=["GET"])
def get_claims():
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, patient_id, patient_name, provider_id, provider_name, amount, risk_score, risk_level, status, created_at FROM claims ORDER BY created_at DESC")
        claims = []
        for row in cursor.fetchall():
            claims.append({
                "id": row[0],
                "patientId": row[1],
                "patient": row[2] or row[1], # Fallback to ID if name is missing
                "providerId": row[3],
                "provider": row[4] or row[3],
                "amount": float(row[5]) if row[5] else 0,
                "risk": float(row[6]) if row[6] else 0,
                "risk_level": row[7],
                "status": row[8].lower() if row[8] else 'pending',
                "time": str(row[9])
            })
        cursor.close()
        return jsonify(claims), 200
    except Exception as e:
        print("DB Error getting claims:", e)
        return jsonify({"success": False, "error": "Database error"}), 500

@claims_bp.route("/claims/<claim_id>", methods=["GET"])
def get_claim_by_id(claim_id):
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("SELECT id, patient_id, patient_name, provider_id, provider_name, amount, diagnosis, procedure_code, risk_score, risk_level, status, ai_summary, created_at FROM claims WHERE id = %s", (claim_id,))
        row = cursor.fetchone()
        cursor.close()
        if row:
            claim_data = {
                "id": row[0],
                "patientId": row[1],
                "patientName": row[2],
                "providerId": row[3],
                "providerName": row[4],
                "amount": float(row[5]) if row[5] else 0,
                "diagnosis": row[6],
                "procedure_code": row[7],
                "risk": int(row[8]) if row[8] else 0,
                "riskLevel": row[9],
                "status": row[10].lower() if row[10] else 'pending',
                "ai_summary": row[11],
                "time": str(row[12]) if len(row) > 12 else None
            }
            return jsonify({"success": True, "claim": claim_data}), 200
        return jsonify({"success": False, "error": "Claim not found"}), 404
    except Exception as e:
        print("DB Error getting claim by id:", e)
        return jsonify({"success": False, "error": "Database error"}), 500

@claims_bp.route("/claims/<claim_id>/fraud-explanation", methods=["GET"])
def get_fraud_explanation(claim_id):
    try:
        cursor = mysql.connection.cursor()
        # Try to fetch weight column — fall back gracefully if column doesn't exist yet
        try:
            cursor.execute("SELECT reason, severity, weight FROM fraud_flags WHERE claim_id = %s", (claim_id,))
            rows = cursor.fetchall()
            reasons = []
            for row in rows:
                reason, severity, weight = row[0], row[1], row[2]
                # If weight column is NULL (old rows), compute it from the reason text
                if weight is None:
                    _, weight = _reason_to_severity_weight(reason)
                reasons.append({"reason": reason, "severity": severity, "weight": int(weight)})
        except Exception:
            # weight column may not exist on older DB — fall back to reason+severity only
            cursor.execute("SELECT reason, severity FROM fraud_flags WHERE claim_id = %s", (claim_id,))
            reasons = []
            for row in cursor.fetchall():
                reason, severity = row[0], row[1]
                _, weight = _reason_to_severity_weight(reason)
                reasons.append({"reason": reason, "severity": severity, "weight": weight})

        # Also fetch the claim's ai_summary and risk_score for the summary + recommendation
        cursor.execute("SELECT ai_summary, risk_score FROM claims WHERE id = %s", (claim_id,))
        claim_row = cursor.fetchone()
        cursor.close()

        summary = claim_row[0] if claim_row else "AI detected unusual patterns in this claim."
        risk_score = int(claim_row[1]) if claim_row and claim_row[1] else 0

        recommendation = (
            "Recommend immediate manual audit and possible recoupment." if risk_score >= 70
            else "Recommend standard review before processing." if risk_score >= 40
            else "Claim appears low risk. Standard processing recommended."
        )

        return jsonify({
            "success": True,
            "summary": summary,
            "recommendation": recommendation,
            "reasons": reasons
        }), 200
    except Exception as e:
        print("DB Error getting fraud explanation:", e)
        return jsonify({"success": False, "error": "Database error"}), 500

@claims_bp.route("/claims/<claim_id>/status", methods=["PATCH"])
def update_claim_status(claim_id):
    try:
        data = request.json
        status = data.get("status")
        notes = data.get("auditNotes", "")
        
        cursor = mysql.connection.cursor()
        cursor.execute("UPDATE claims SET status = %s WHERE id = %s", (status, claim_id))
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True, "message": "Status updated"}), 200
    except Exception as e:
        print("DB Error updating claim status:", e)
        return jsonify({"success": False, "error": "Database error"}), 500


@claims_bp.route("/claims", methods=["DELETE"])
def delete_all_claims():
    """Delete all claims and their associated fraud flags (admin use only)."""
    try:
        cursor = mysql.connection.cursor()
        cursor.execute("DELETE FROM fraud_flags")
        cursor.execute("DELETE FROM claims")
        # Reset auto-increment so IDs start from 1 again
        cursor.execute("ALTER TABLE fraud_flags AUTO_INCREMENT = 1")
        cursor.execute("ALTER TABLE claims AUTO_INCREMENT = 1")
        mysql.connection.commit()
        cursor.close()
        return jsonify({"success": True, "message": "All claims deleted successfully"}), 200
    except Exception as e:
        print("DB Error deleting all claims:", e)
        return jsonify({"success": False, "error": "Database error"}), 500