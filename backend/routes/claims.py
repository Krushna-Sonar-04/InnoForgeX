from flask import Blueprint, request, jsonify

from database.db import mysql
from services.fraud_engine import analyze_claim

claims_bp = Blueprint("claims", __name__)


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

            insert_flag_query = """

            INSERT INTO fraud_flags (

                claim_id,
                reason,
                severity

            )

            VALUES (%s,%s,%s)

            """

            flag_values = (

                claim_id,
                reason,
                "HIGH"

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
        cursor.execute("SELECT reason, severity FROM fraud_flags WHERE claim_id = %s", (claim_id,))
        reasons = [{"reason": row[0], "severity": row[1]} for row in cursor.fetchall()]
        cursor.close()
        return jsonify({"success": True, "reasons": reasons}), 200
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