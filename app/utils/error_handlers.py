"""
Global error handlers — every error the API returns looks the same.
Frontend always gets: { "error": str, "code": int, "details": any }
"""

from flask import jsonify
import logging

logger = logging.getLogger(__name__)


def register_error_handlers(app):

    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad request", "code": 400,
                        "details": str(e)}), 400

    @app.errorhandler(401)
    def unauthorized(e):
        return jsonify({"error": "Unauthorized", "code": 401,
                        "details": "Valid credentials required"}), 401

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({"error": "Forbidden", "code": 403,
                        "details": str(e)}), 403

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found", "code": 404,
                        "details": str(e)}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({"error": "Method not allowed", "code": 405,
                        "details": str(e)}), 405

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify({"error": "Unprocessable entity", "code": 422,
                        "details": str(e)}), 422

    @app.errorhandler(429)
    def rate_limited(e):
        return jsonify({"error": "Too many requests", "code": 429,
                        "details": "Slow down — rate limit hit"}), 429

    @app.errorhandler(500)
    def internal_error(e):
        logger.error(f"Internal server error: {e}")
        return jsonify({"error": "Internal server error", "code": 500,
                        "details": "Check server logs"}), 500

    @app.errorhandler(Exception)
    def unhandled_exception(e):
        logger.exception(f"Unhandled exception: {e}")
        return jsonify({"error": "Unexpected error", "code": 500,
                        "details": str(e)}), 500