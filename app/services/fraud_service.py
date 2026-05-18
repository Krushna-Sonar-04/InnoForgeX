"""
Fraud Service — the AI orchestration pipeline.

This is the ONLY file the route layer talks to for fraud analysis.
It chains: rule_engine → prompt_builder → groq_client → response_parser
and returns one clean, predictable dict to the caller.

The route doesn't know (or care) about Groq, prompts, or parsing.
It just calls analyze_claim() and gets back a result.
"""

import logging
from datetime import datetime

from .rule_engine      import run_rules
from .prompt_builder   import build_fraud_analysis_prompt
from .groq_client      import call_llm
from .response_parser  import parse_llm_response

logger = logging.getLogger(__name__)


def analyze_claim(claim: dict) -> dict:
    """
    Full fraud analysis pipeline for a single claim.

    Args:
        claim: Validated claim dict from the route layer.
                Must contain at minimum: claim_id, claim_amount,
                procedure_codes, diagnosis_codes, service_date.

    Returns:
        {
            "claim_id":          str,
            "analyzed_at":       ISO timestamp string,
            "rule_result":       dict  (from rule engine),
            "ai_result":         dict  (from LLM + parser),
            "final_risk_score":  int   (0-100),
            "final_verdict":     str   (low/medium/high/critical),
            "recommended_action": str,
            "pipeline_status":   str   (success/partial/failed),
        }
    """
    claim_id = claim.get("claim_id", "UNKNOWN")
    logger.info(f"Starting fraud analysis — claim_id: {claim_id}")

    result = {
        "claim_id":           claim_id,
        "analyzed_at":        datetime.utcnow().isoformat() + "Z",
        "rule_result":        {},
        "ai_result":          {},
        "final_risk_score":   50,
        "final_verdict":      "medium",
        "recommended_action": "review",
        "pipeline_status":    "failed",
    }

    # ── Stage 1: Rule engine ──────────────────────────────────────
    try:
        rule_result = run_rules(claim)
        result["rule_result"] = rule_result
        logger.info(f"Rule engine done — score: {rule_result['rule_score']}, "
                    f"flags: {rule_result['flags']}")
    except Exception as e:
        logger.error(f"Rule engine failed: {e}")
        rule_result = {"flags": [], "rule_score": 0, "passed": True}
        result["rule_result"] = rule_result

    # ── Stage 2: Prompt construction ─────────────────────────────
    try:
        system_prompt, user_prompt = build_fraud_analysis_prompt(claim, rule_result)
    except Exception as e:
        logger.error(f"Prompt builder failed: {e}")
        result["pipeline_status"] = "partial"
        result["final_risk_score"] = rule_result.get("rule_score", 50)
        return result

    # ── Stage 3: LLM call ─────────────────────────────────────────
    try:
        raw_llm_output = call_llm(system_prompt, user_prompt)
    except RuntimeError as e:
        logger.error(f"LLM call failed: {e}")
        # Degrade gracefully — use rule score only
        result["pipeline_status"]   = "partial"
        result["final_risk_score"]  = rule_result.get("rule_score", 50)
        result["final_verdict"]     = _score_to_verdict(result["final_risk_score"])
        result["recommended_action"] = _verdict_to_action(result["final_verdict"])
        result["ai_result"] = {
            "error":   str(e),
            "fallback": "Rule-based scoring used — LLM unavailable"
        }
        return result

    # ── Stage 4: Parse + validate LLM response ────────────────────
    try:
        ai_result = parse_llm_response(raw_llm_output)
        result["ai_result"] = ai_result
    except Exception as e:
        logger.error(f"Response parser failed: {e}")
        result["pipeline_status"]  = "partial"
        result["final_risk_score"] = rule_result.get("rule_score", 50)
        return result

    # ── Stage 5: Merge rule score + AI score ──────────────────────
    # Weighted blend: AI is more trustworthy, but rules catch obvious cases
    ai_score   = ai_result.get("risk_score", 50)
    rule_score = rule_result.get("rule_score", 0)
    final_score = _blend_scores(ai_score, rule_score)

    result["final_risk_score"]   = final_score
    result["final_verdict"]      = ai_result.get("verdict", _score_to_verdict(final_score))
    result["recommended_action"] = ai_result.get("recommended_action", "review")
    result["pipeline_status"]    = "success"

    logger.info(f"Analysis complete — claim: {claim_id}, "
                f"score: {final_score}, verdict: {result['final_verdict']}")

    return result


# ── Helper functions ──────────────────────────────────────────────────────────

def _blend_scores(ai_score: int, rule_score: int) -> int:
    """
    Weighted blend of AI score (70%) and rule score (30%).
    Rule score can only push the final score UP, never down.
    This prevents the LLM from underplaying obvious rule violations.
    """
    blended = int(ai_score * 0.7 + rule_score * 0.3)
    # Rule score can boost but never reduce
    final = max(blended, rule_score if rule_score > 70 else blended)
    return min(final, 100)


def _score_to_verdict(score: int) -> str:
    if score >= 90: return "critical"
    if score >= 70: return "high"
    if score >= 40: return "medium"
    return "low"


def _verdict_to_action(verdict: str) -> str:
    return {
        "low":      "approve",
        "medium":   "review",
        "high":     "escalate",
        "critical": "reject",
    }.get(verdict, "review")