"""
Centralized logging configuration.
Call setup_logging() once at app startup.
"""

import logging
import sys


def setup_logging(debug: bool = False):
    """
    Configure root logger for the whole app.
    All modules that do logging.getLogger(__name__) inherit this config.
    """
    level  = logging.DEBUG if debug else logging.INFO
    format = "%(asctime)s [%(levelname)-8s] %(name)s — %(message)s"

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter(format))

    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.handlers = []       # Clear any default handlers
    root_logger.addHandler(handler)

    # Silence noisy third-party loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("groq").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)

    logging.getLogger(__name__).info(
        f"Logging initialised — level: {'DEBUG' if debug else 'INFO'}"
    )