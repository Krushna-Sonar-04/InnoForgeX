"""
Prompt Builder — converts a claim dict + rule flags into
a structured LLM prompt for Groq / LLaMA 3.

Design principles:
  1. Tell the model its ROLE first (system-level context)
  2. Give structured claim data (not a paragraph)
  3. Give rule engine flags as explicit hints
  4. Define EXACT JSON output format — no ambiguity
  5. Prohibit any text outside the JSON block
  6. Keep total tokens under ~800 for speed + free tier limits
"""

import json
import logging

logger = logging.getLogger(__name__)


# ── Prompt Templates ─────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert healthcare insurance fraud detection AI.
Your job is to analyze submitted insurance claims and determine the likelihood of fraud.
You reason like a senior insurance investigator with 20 years of experience.
You are precise, evidence-based, and explain your reasoning clearly.
You ALWAYS respond with valid JSON only. No preamble. No explanation outside the JSON."""


def build_fraud_analysis_prompt(claim: dict, rule_result: dict) -> tuple[str, str]:
    """
    Build system + user prompt for fraud analysis.

    Args:
        claim:       Raw claim dict from API request
        rule_result: Output of rule_engine.run_rules()

    Returns:
        Tuple of (system_prompt, user_prompt)
    """
    user_prompt = _build_user_prompt(claim, rule_result)
    logger.debug(f"Prompt built — approx tokens: {len(user_prompt.split())}")
    return SYSTEM_PROMPT, user_prompt


def _build_user_prompt(claim: dict, rule_result: dict) -> str:
    """Construct the structured user-facing prompt."""

    # Sanitize and format claim fields with safe defaults
    claim_summary = {
        "claim_id":         claim.get("claim_id",        "N/A"),
        "patient_age":      claim.get("patient_age",     "Unknown"),
        "patient_gender":   claim.get("patient_gender",  "Unknown"),
        "provider_type":    claim.get("provider_type",   "Unknown"),
        "provider_specialty": claim.get("provider_specialty", "Unknown"),
        "claim_amount_usd": claim.get("claim_amount",    0),
        "service_date":     claim.get("service_date",    "Unknown"),
        "diagnosis_codes":  claim.get("diagnosis_codes", []),
        "procedure_codes":  claim.get("procedure_codes", []),
        "place_of_service": claim.get("place_of_service","Unknown"),
        "insurance_type":   claim.get("insurance_type",  "Unknown"),
        "notes":            claim.get("notes",           "None"),
    }

    rule_flags   = rule_result.get("flags", [])
    rule_score   = rule_result.get("rule_score", 0)
    rules_passed = rule_result.get("passed", True)

    prompt = f"""
Analyze the following healthcare insurance claim for potential fraud.

## CLAIM DATA
{json.dumps(claim_summary, indent=2)}

## PRE-ANALYSIS FLAGS (from rule engine)
Rule-based risk score : {rule_score}/100
Rules passed          : {rules_passed}
Detected flags        : {rule_flags if rule_flags else "None"}

## YOUR TASK
Based on the claim data and pre-analysis flags above:
1. Assess overall fraud risk (0 = no risk, 100 = definite fraud)
2. Identify specific suspicious patterns
3. Provide a clear, concise explanation of your reasoning
4. Give a final verdict

## RESPONSE FORMAT
Respond ONLY with this exact JSON structure. No text before or after.

{{
  "risk_score": <integer 0-100>,
  "verdict": "<one of: low | medium | high | critical>",
  "confidence": <float 0.0-1.0>,
  "flags": [
    "<specific suspicious finding 1>",
    "<specific suspicious finding 2>"
  ],
  "reasoning": "<2-3 sentence investigator-style explanation of why this claim is or is not suspicious>",
  "recommended_action": "<one of: approve | review | escalate | reject>",
  "pattern_type": "<one of: clean | billing_inflation | duplicate | identity_fraud | phantom_service | upcoding | unbundling | unknown>"
}}

RULES:
- risk_score must be an integer between 0 and 100
- verdict must be exactly: low (0-39), medium (40-69), high (70-89), critical (90-100)
- flags must be an array of strings (can be empty array if none)
- reasoning must be a single string, no line breaks
- Do NOT include any text outside the JSON object
"""

    return prompt.strip()