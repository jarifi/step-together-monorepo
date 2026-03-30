import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path

# Resolve log directory from project root (not current working directory).
PROJECT_ROOT = Path(__file__).resolve().parents[1]
LOG_DIR = PROJECT_ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

LOG_FILE = LOG_DIR / "step_together.log"

handler = RotatingFileHandler(
    LOG_FILE,
    maxBytes=5 * 1024 * 1024,
    backupCount=3,
)

formatter = logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
    )

handler.setFormatter(formatter)

stream_handler = logging.StreamHandler()
stream_handler.setFormatter(formatter)

def create_logger(name: str) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)

    if not logger.handlers:
        logger.addHandler(handler)
        logger.addHandler(stream_handler)

    logger.propagate = False
    return logger

auth_logger = create_logger("auth")
step_logger = create_logger("step_logs")
challenge_logger = create_logger("challenges")
team_logger = create_logger("teams")
user_logger = create_logger("users")
challenge_progress_logger = create_logger("challenge_progress")
team_member_logger = create_logger("team_members")