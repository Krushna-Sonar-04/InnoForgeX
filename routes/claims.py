from flask import Blueprint, request, jsonify

from database.db import mysql

from services.fraud_engine import analyze_claim

claims_bp = Blueprint("claims", __name__)

@claims_bp.route("/claims", methods=["POST"])
def create_claim():

    try:

        data = request.json

        result = analyze_claim(data)

        cursor = mysql.connection.cursor()

        # INSERT CLAIM
        cursor.execute("""

        INSERT INTO claims (

            patient_id,
            provider_id,
            amount,
            diagnosis,
            procedure_code,
            risk_score,
            risk_level,
            status,
            ai_summary

        )

        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)

        """, (

            data["patient_id"],
            data["provider_id"],
            data["amount"],
            data["diagnosis"],
            data["procedure_code"],
            result["risk_score"],
            result["risk_level"],
            "UNDER_REVIEW",
            result["ai_summary"]

        ))

        mysql.connection.commit()

        claim_id = cursor.lastrowid

        # INSERT FRAUD FLAGS
        for reason in result["reasons"]:

            cursor.execute("""

            INSERT INTO fraud_flags (

                claim_id,
                reason,
                severity

            )

            VALUES (%s,%s,%s)

            """, (

                claim_id,
                reason,
                "HIGH"

            ))

        mysql.connection.commit()

        cursor.close()

        return jsonify({
            "success": True,
            "message": "Claim inserted successfully",
            "claim_id": claim_id,
            "fraud_analysis": result
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500