import os
import logging
from flask import Flask, app
from .config import config_map
from .extensions import cors

def create_app():
    """Application factory — creates and wires up the Flask app."""

    app = Flask(__name__)

    # ── 1. Load config ───────────────────────────────────────────
    env  = os.environ.get("FLASK_ENV", "development")
    cfg  = config_map.get(env, config_map["development"])
    app.config.from_object(cfg)

    # ── 2. Init extensions ───────────────────────────────────────
    cors.init_app(
        app,
        resources={r"/api/*": {"origins": app.config["FRONTEND_URL"]}},
        supports_credentials=True,
    )

    # ── 3. Setup logging ─────────────────────────────────────────
    from .utils.logger import setup_logging
    setup_logging(debug=app.config.get("DEBUG", False))
    app.logger.info(f"App started in '{env}' mode")

    # ── 4. Register blueprints (routes) ──────────────────────────
    from .routes.claims   import claims_bp
    from .routes.fraud    import fraud_bp
    from .routes.dashboard import dashboard_bp

    app.register_blueprint(claims_bp,    url_prefix="/api/claims")
    app.register_blueprint(fraud_bp,     url_prefix="/api/fraud")
    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")

    # ── 5. Register global error handlers ────────────────────────
    from .utils.error_handlers import register_error_handlers
    register_error_handlers(app)

    # ── 6. Health check (Render needs this) ──────────────────────
    @app.route("/health")
    def health():
        return {"status": "ok", "env": env}, 200

    return app