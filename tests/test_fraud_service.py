from app.services.fraud_service import analyze_claim

sample_claim = {
    "claim_id": "CLM-001",
    "patient_id": "P1001",
    "patient_age": 72,
    "patient_gender": "M",
    "provider_id": "DR200",
    "provider_type": "hospital",
    "provider_specialty": "cardiology",
    "claim_amount": 25000,
    "service_date": "2026-05-10",
    "discharge_date": "2026-05-12",
    "diagnosis_codes": ["I25.10"],
    "procedure_codes": ["99215", "27447"],
    "place_of_service": "inpatient",
    "insurance_type": "Medicare",
    "notes": "Emergency surgery"
}

result = analyze_claim(sample_claim)

print("\n===== FRAUD ANALYSIS RESULT =====")
print(result)