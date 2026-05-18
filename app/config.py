import os

class Config:
    """Base configuration loaded from environment variables."""

    # Flask
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-fallback")
    FLASK_ENV  = os.environ.get("FLASK_ENV", "development")

    # Groq AI
    GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
    GROQ_MODEL   = os.environ.get("GROQ_MODEL", "llama3-8b-8192")

    # CORS
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")

    # JWT (optional)
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-fallback")

    # Fraud thresholds (tunable without code changes)
    HIGH_RISK_THRESHOLD    = int(os.environ.get("HIGH_RISK_THRESHOLD", 70))
    CRITICAL_RISK_THRESHOLD = int(os.environ.get("CRITICAL_RISK_THRESHOLD", 90))


class DevelopmentConfig(Config):
    DEBUG = True


class ProductionConfig(Config):
    DEBUG = False


# Map string → class so __init__.py can select it
config_map = {
    "development": DevelopmentConfig,
    "production":  ProductionConfig,
}