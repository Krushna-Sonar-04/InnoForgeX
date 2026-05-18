def detect_anomalies(data, cursor=None):
    reasons = []
    
    try:
        amount = float(data.get("amount", 0))
    except (ValueError, TypeError):
        amount = 0
        
    procedure = str(data.get("procedure_code", "")).strip()
    diagnosis = str(data.get("diagnosis", "")).strip()
    provider_id = data.get("provider_id")
    patient_id = data.get("patient_id")
    
    # 1. Billing Amount Outliers
    if amount > 1000000:
        reasons.append("Extreme billing outlier amount (> $1,000,000)")
    elif amount > 100000:
        reasons.append("Critical billing outlier amount (> $100,000)")
    elif amount > 10000:
        reasons.append("High billing outlier amount (> $10,000)")

    # 2. Clinical & Procedure Code Mismatches
    # E&M codes (99201-99215) should be cheap outpatient visits
    if procedure.startswith("992") and amount > 5000:
        reasons.append("Evaluation and Management (E&M) upcoding mismatch (excessive fee for outpatient visit)")
        
    # Cardiovascular bypass code (33533) requires cardiovascular diagnosis, not simple back pain (M54.5) or cold (J00)
    if procedure == "33533" and diagnosis in ["M54.5", "M54.4", "J00", "J06.9"]:
        reasons.append("Severe clinical procedure-diagnosis code mismatch (heart bypass billed for back pain or common cold)")

    # 3. Database-driven Duplicate Detection
    if cursor and patient_id and provider_id and amount > 0:
        try:
            cursor.execute(
                "SELECT COUNT(*) FROM claims WHERE patient_id = %s AND provider_id = %s AND amount = %s AND procedure_code = %s",
                (patient_id, provider_id, amount, procedure)
            )
            count = cursor.fetchone()[0]
            if count > 0:
                reasons.append("Duplicate claim detected (potential double-billing/phantom services)")
        except Exception as e:
            print("DB error detecting duplicate claims:", e)

    # 4. Database-driven Provider Reputation Alert
    if cursor and provider_id:
        try:
            cursor.execute(
                "SELECT COUNT(*) FROM claims WHERE provider_id = %s AND (status = 'REJECTED' OR status = 'flagged' OR risk_level = 'HIGH')",
                (provider_id,)
            )
            flagged_claims = cursor.fetchone()[0]
            if flagged_claims >= 2:
                reasons.append(f"Historical provider fraud alert (provider has {flagged_claims} previously flagged/rejected claims)")
        except Exception as e:
            print("DB error checking provider reputation:", e)

    return reasons