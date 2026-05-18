"""
Groq Client — sends prompts to LLaMA 3 via Groq Cloud API.

Why Groq instead of HuggingFace?
  - Groq offers FREE access to LLaMA 3 (8B and 70B)
  - Response times: 200–800ms vs HuggingFace's 3–10s
  - Much more reliable JSON output (critical for parsing)
  - 14,400 requests/day on free tier — plenty for a hackathon
  - Official Python SDK — clean, no raw HTTP needed

Model choice: llama3-8b-8192
  - 8B params — fast, free, capable
  - 8192 token context — handles any claim size
  - Excellent instruction following for structured output
  - Upgrade path: swap to llama3-70b-8192 for higher accuracy
"""

import logging
from groq import Groq
from flask import current_app

logger = logging.getLogger(__name__)


def get_groq_client() -> Groq:
    """Instantiate Groq client using API key from app config."""
    api_key = current_app.config.get("GROQ_API_KEY")
    if not api_key:
        raise ValueError("GROQ_API_KEY is not set in environment variables.")
    return Groq(api_key=api_key)


def call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Send a chat completion request to Groq.

    Args:
        system_prompt: Sets the AI's role and behavior rules
        user_prompt:   The actual claim data + instructions

    Returns:
        Raw string content from the LLM response

    Raises:
        RuntimeError: If the API call fails for any reason
    """
    model  = current_app.config.get("GROQ_MODEL", "llama3-8b-8192")
    client = get_groq_client()

    logger.info(f"Calling Groq LLM — model: {model}")

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            temperature=0.1,      # Near-deterministic — critical for consistent JSON
            max_tokens=600,       # Enough for our JSON schema, avoids waste
            top_p=0.9,
            stream=False,
        )

        raw_output = response.choices[0].message.content.strip()

        logger.info("Groq response received successfully")
        logger.debug(f"Raw LLM output: {raw_output[:300]}...")   # log first 300 chars

        return raw_output

    except Exception as e:
        logger.error(f"Groq API call failed: {str(e)}")
        raise RuntimeError(f"LLM call failed: {str(e)}")