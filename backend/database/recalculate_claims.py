import os
import sys
import MySQLdb

# Add backend directory to sys.path to import config and services
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config
from services.fraud_engine import analyze_claim

def recalculate_historical_claims():
    try:
        print("Connecting to MySQL server...")
        db = MySQLdb.connect(
            host=config.MYSQL_HOST,
            user=config.MYSQL_USER,
            passwd=config.MYSQL_PASSWORD,
            db=config.MYSQL_DB
        )
        cursor = db.cursor()

        print("Fetching all historical claims from database...")
        cursor.execute("SELECT id, patient_id, patient_name, provider_id, provider_name, amount, diagnosis, procedure_code FROM claims")
        claims = cursor.fetchall()
        print(f"Found {len(claims)} claims to process.\n")

        for claim in claims:
            claim_id, patient_id, patient_name, provider_id, provider_name, amount, diagnosis, procedure_code = claim
            
            # Reconstruct the claim data dictionary
            claim_data = {
                "patient_id": patient_id,
                "patient_name": patient_name,
                "provider_id": provider_id,
                "provider_name": provider_name,
                "amount": float(amount) if amount else 0.0,
                "diagnosis": diagnosis,
                "procedure_code": procedure_code
            }

            print(f"Processing Claim ID {claim_id}: {patient_name} - Amount: ${claim_data['amount']:.2f}")

            # Run through the new dynamic AI engine
            analysis = analyze_claim(claim_data, cursor)

            # Update the main claims table
            update_query = """
                UPDATE claims 
                SET risk_score = %s, risk_level = %s, ai_summary = %s
                WHERE id = %s
            """
            cursor.execute(update_query, (
                analysis["risk_score"],
                analysis["risk_level"],
                analysis["ai_summary"],
                claim_id
            ))

            # Clear out any old flags for this claim to avoid duplicates
            cursor.execute("DELETE FROM fraud_flags WHERE claim_id = %s", (claim_id,))

            # Insert the new, rich dynamic flags
            for reason in analysis["reasons"]:
                insert_flag_query = """
                    INSERT INTO fraud_flags (claim_id, reason, severity)
                    VALUES (%s, %s, %s)
                """
                cursor.execute(insert_flag_query, (claim_id, reason, "HIGH" if analysis["risk_score"] >= 70 else "MEDIUM"))

            print(f"   -> Updated Risk Score: {analysis['risk_score']}% ({analysis['risk_level']})")
            print(f"   -> Flagged Reasons: {analysis['reasons']}\n")

        db.commit()
        cursor.close()
        db.close()
        print("Successfully recalculated and updated all historical claims in the database!")

    except Exception as e:
        print(f"Failed to recalculate claims: {e}")

if __name__ == "__main__":
    recalculate_historical_claims()
