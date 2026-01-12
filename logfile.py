import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

def create_logger(name: str, filename: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    handler = RotatingFileHandler(
        LOG_DIR / filename,
        maxBytes=5 * 1024 * 1024,
        backupCount=3
    )

    formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(message)s"
    )

    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.propagate = False

    return logger

auth_logger = create_logger("auth", "auth.log")
step_logger = create_logger("step_logs", "step_logs.log")

