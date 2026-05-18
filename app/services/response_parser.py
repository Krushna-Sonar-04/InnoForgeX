"""
Response Parser — converts raw LLM text into a validated Python dict.

Why this module exists:
  Even with perfect prompts, LLMs sometimes:
  - Wrap JSON in ```json ... ``` code fences
  - Add a sentence before/after the JSON
  - Return slightly wrong field types (string instead of int)
  - Omit optional fields

  This module handles ALL of that gracefully, so the rest of
  the app always receives a clean, typed, predictable dict.
"""

import json
import re
import logging
from pydantic import BaseModel, Field, field_validator
from typing import List

logger = logging.getLogger(__name__)


# ── Pydantic schema — the single source of truth for fraud result shape ───────

class FraudAnalysisResult(BaseModel):
    """Validated fraud analysis output from the LLM."""

    risk_score:         int         = Field(..., ge=0, le=100)
    verdict:            str         = Field(...)
    confidence:         float       = Field(..., ge=0.0, le=1.0)
    flags:              List[str]   = Field(default_factory=list)
    reasoning:          str         = Field(...)
    recommended_action: str         = Field(...)
    pattern_type:       str         = Field(default="unknown")

    @field_validator("verdict")
    @classmethod
    def validate_verdict(cls, v):
        allowed = {"low", "medium", "high", "critical"}
        v = v.lower().strip()
        if v not in allowed:
            # Auto-correct based on common LLM variations
            if v in ("minimal", "none", "safe", "clean"):
                return "low"
            if v in ("moderate", "suspicious"):
                return "medium"
            if v in ("severe", "dangerous"):
                return "high"
            return "medium"    # safe fallback
        return v

    @field_validator("recommended_action")
    @classmethod
    def validate_action(cls, v):
        allowed = {"approve", "review", "escalate", "reject"}
        v = v.lower().strip()
        return v if v in allowed else "review"

    @field_validator("risk_score", mode="before")
    @classmethod
    def coerce_risk_score(cls, v):
        return int(float(str(v)))   # handles "75", 75.0, "75.0"


# ── Main parsing function ─────────────────────────────────────────────────────

def parse_llm_response(raw_text: str) -> dict:
    """
    Extract and validate JSON from raw LLM output.

    Strategy:
      1. Try direct JSON parse
      2. Extract from code fence if present
      3. Find first { ... } block via regex
      4. Return a safe fallback if all else fails

    Args:
        raw_text: Raw string from Groq LLM response

    Returns:
        Validated dict matching FraudAnalysisResult schema
    """
    logger.debug("Parsing LLM response...")

    # ── Attempt 1: clean direct parse ────────────────────────────
    try:
        data = json.loads(raw_text)
        return _validate_and_build(data)
    except json.JSONDecodeError:
        pass

    # ── Attempt 2: strip ```json ... ``` code fences ─────────────
    fence_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", raw_text)
    if fence_match:
        try:
            data = json.loads(fence_match.group(1))
            return _validate_and_build(data)
        except json.JSONDecodeError:
            pass

    # ── Attempt 3: find first complete { ... } block ─────────────
    brace_match = re.search(r"\{[\s\S]*\}", raw_text)
    if brace_match:
        try:
            data = json.loads(brace_match.group())
            return _validate_and_build(data)
        except json.JSONDecodeError:
            pass

    # ── Attempt 4: safe fallback (never crash the API) ────────────
    logger.warning("All JSON parse attempts failed — returning safe fallback")
    return _fallback_result(raw_text)


def _validate_and_build(data: dict) -> dict:
    """Run Pydantic validation and return clean dict."""
    try:
        result = FraudAnalysisResult(**data)
        logger.debug("Pydantic validation passed")
        return result.model_dump()
    except Exception as e:
        logger.warning(f"Pydantic validation error: {e} — applying field-level repair")
        return _repair_and_build(data)


def _repair_and_build(data: dict) -> dict:
    """
    Best-effort repair when Pydantic validation fails.
    Fills missing fields with safe defaults.
    """
    return {
        "risk_score":         _safe_int(data.get("risk_score"), 50),
        "verdict":            _safe_verdict(data.get("verdict")),
        "confidence":         _safe_float(data.get("confidence"), 0.5),
        "flags":              data.get("flags", []) if isinstance(data.get("flags"), list) else [],
        "reasoning":          str(data.get("reasoning", "Unable to determine — manual review required.")),
        "recommended_action": _safe_action(data.get("recommended_action")),
        "pattern_type":       str(data.get("pattern_type", "unknown")),
    }


def _fallback_result(raw_text: str) -> dict:
    """Last-resort fallback — returned when LLM output is completely unparseable."""
    return {
        "risk_score":         50,
        "verdict":            "medium",
        "confidence":         0.3,
        "flags":              ["PARSE_FAILURE"],
        "reasoning":          "Automated analysis failed to parse — flagged for manual review.",
        "recommended_action": "review",
        "pattern_type":       "unknown",
        "raw_llm_output":     raw_text[:500],   # keep for debugging
    }


# ── Safe type helpers ─────────────────────────────────────────────────────────

def _safe_int(val, default: int) -> int:
    try:    return max(0, min(100, int(float(str(val)))))
    except: return default

def _safe_float(val, default: float) -> float:
    try:    return max(0.0, min(1.0, float(str(val))))
    except: return default

def _safe_verdict(val) -> str:
    allowed = {"low", "medium", "high", "critical"}
    return val.lower().strip() if isinstance(val, str) and val.lower().strip() in allowed else "medium"

def _safe_action(val) -> str:
    allowed = {"approve", "review", "escalate", "reject"}
    return val.lower().strip() if isinstance(val, str) and val.lower().strip() in allowed else "review"