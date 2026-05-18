"""
Rule Engine — lightweight pre-LLM fraud checks.

Runs instant deterministic rules against claim data.
Returns flags that are injected into the LLM prompt
so the model has structured hints to reason over.

These rules are intentionally simple — the LLM handles
complex pattern reasoning. Rules catch obvious cases cheaply.
"""

from datetime import datetime
import logging

logger = logging.getLogger(__name__)


# ── Thresholds (tune per domain) ─────────────────────────────────────────────
RULES_CONFIG = {
    "high_amount_threshold":      10_000,   # USD
    "very_high_amount_threshold":  50_000,
    "max_procedures_per_claim":       10,
    "duplicate_window_days":          30,
    "suspicious_procedure_codes": {         # Known high-abuse procedure codes
        "99215", "99214", "90837", "27447", "43239"
    },
    "max_age_for_pediatric":          17,
    "min_age_for_geriatric":          65,
}


def run_rules(claim: dict) -> dict:
    """
    Run all rules against a claim dict.

    Args:
        claim: Raw claim dictionary from the API request.

    Returns:
        {
            "flags":       list of rule violation strings,
            "rule_score":  int 0–100 (pre-LLM risk indicator),
            "passed":      bool (False = definitely suspicious),
        }
    """
    flags      = []
    risk_points = 0

    _check_amount(claim, flags)
    _check_procedures(claim, flags)
    _check_dates(claim, flags)
    _check_patient_provider(claim, flags)
    _check_duplicate_indicators(claim, flags)

    # Score: each flag adds weight
    flag_weights = {
        "AMOUNT_HIGH":            15,
        "AMOUNT_VERY_HIGH":       35,
        "MANY_PROCEDURES":        20,
        "SUSPICIOUS_PROC_CODE":   25,
        "FUTURE_SERVICE_DATE":    40,
        "SERVICE_AFTER_DISCHARGE":30,
        "PATIENT_PROVIDER_SAME":  50,
        "DUPLICATE_CLAIM_HINT":   45,
        "MISSING_DIAGNOSIS":      10,
        "WEEKEND_SURGERY":         8,
    }

    for flag in flags:
        risk_points += flag_weights.get(flag, 10)

    rule_score = min(risk_points, 100)   # cap at 100

    logger.debug(f"Rule engine result — flags: {flags}, score: {rule_score}")

    return {
        "flags":      flags,
        "rule_score": rule_score,
        "passed":     len(flags) == 0,
    }


# ── Individual rule checks ────────────────────────────────────────────────────

def _check_amount(claim: dict, flags: list):
    amount = float(claim.get("claim_amount", 0))
    if amount >= RULES_CONFIG["very_high_amount_threshold"]:
        flags.append("AMOUNT_VERY_HIGH")
    elif amount >= RULES_CONFIG["high_amount_threshold"]:
        flags.append("AMOUNT_HIGH")


def _check_procedures(claim: dict, flags: list):
    procedures = claim.get("procedure_codes", [])
    if not isinstance(procedures, list):
        procedures = [procedures]

    if len(procedures) > RULES_CONFIG["max_procedures_per_claim"]:
        flags.append("MANY_PROCEDURES")

    suspicious = RULES_CONFIG["suspicious_procedure_codes"]
    for code in procedures:
        if str(code).strip() in suspicious:
            flags.append("SUSPICIOUS_PROC_CODE")
            break   # flag once, don't spam


def _check_dates(claim: dict, flags: list):
    today = datetime.utcnow().date()

    # Service date in the future
    svc_date_str = claim.get("service_date")
    if svc_date_str:
        try:
            svc_date = datetime.strptime(svc_date_str, "%Y-%m-%d").date()
            if svc_date > today:
                flags.append("FUTURE_SERVICE_DATE")
        except ValueError:
            pass

    # Service after discharge
    discharge_str = claim.get("discharge_date")
    if svc_date_str and discharge_str:
        try:
            svc  = datetime.strptime(svc_date_str,  "%Y-%m-%d").date()
            disc = datetime.strptime(discharge_str, "%Y-%m-%d").date()
            if svc > disc:
                flags.append("SERVICE_AFTER_DISCHARGE")
        except ValueError:
            pass


def _check_patient_provider(claim: dict, flags: list):
    # Same person listed as both patient and provider (identity fraud)
    if claim.get("patient_id") and claim.get("provider_id"):
        if str(claim["patient_id"]).strip() == str(claim["provider_id"]).strip():
            flags.append("PATIENT_PROVIDER_SAME")

    # Missing diagnosis code
    if not claim.get("diagnosis_codes"):
        flags.append("MISSING_DIAGNOSIS")


def _check_duplicate_indicators(claim: dict, flags: list):
    # Hint from request payload (teammate's DB layer can set this)
    if claim.get("is_duplicate_hint"):
        flags.append("DUPLICATE_CLAIM_HINT")

    # Weekend surgery for elective procedures (statistical anomaly)
    svc_date_str = claim.get("service_date")
    elective_codes = {"27447", "43239", "70553"}
    procedures = claim.get("procedure_codes", [])
    if svc_date_str and any(c in elective_codes for c in procedures):
        try:
            svc = datetime.strptime(svc_date_str, "%Y-%m-%d").date()
            if svc.weekday() in (5, 6):   # Saturday=5, Sunday=6
                flags.append("WEEKEND_SURGERY")
        except ValueError:
            pass