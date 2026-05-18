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

        # Run fraud analysis
        result = analyze_claim(data)

        cursor = mysql.connection.cursor()

        # Insert into claims table
        insert_claim_query = """

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

        """

        claim_values = (

            data.get("patient_id"),
            data.get("provider_id"),
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