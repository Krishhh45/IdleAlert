import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env or root .env
env_backend = BASE_DIR / ".env"
env_root = BASE_DIR.parent / ".env"
if env_backend.exists():
    load_dotenv(dotenv_path=env_backend, override=True)
elif env_root.exists():
    load_dotenv(dotenv_path=env_root, override=True)
else:
    load_dotenv(override=True)

UPLOAD_DIR = BASE_DIR / "uploads"
IMAGE_UPLOAD_DIR = UPLOAD_DIR / "images"
VIDEO_UPLOAD_DIR = UPLOAD_DIR / "videos"
ANNOTATED_VIDEO_DIR = UPLOAD_DIR / "annotated"
MODELS_DIR = BASE_DIR / "models"

for d in [IMAGE_UPLOAD_DIR, VIDEO_UPLOAD_DIR, ANNOTATED_VIDEO_DIR, MODELS_DIR]:
    d.mkdir(parents=True, exist_ok=True)

DATABASE_URL = f"sqlite:///{BASE_DIR / 'smart_classroom.db'}"

# Security
SECRET_KEY = os.environ.get("SECRET_KEY", "smart_classroom_secret_key_2026")

# YOLO Configuration
_s_model = BASE_DIR / "yolov8s.pt"
_n_model = BASE_DIR / "yolov8n.pt"
YOLO_DEFAULT_MODEL = str(_s_model) if _s_model.exists() else (str(_n_model) if _n_model.exists() else "yolov8s.pt")
_env_custom = os.environ.get("CUSTOM_MODEL_PATH", None)
_dir_custom = MODELS_DIR / "custom_classroom.pt"
CUSTOM_MODEL_PATH = _env_custom if (_env_custom and Path(_env_custom).exists()) else (str(_dir_custom) if _dir_custom.exists() else None)

CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.20"))

def _clean(val: str) -> str:
    if not val:
        return ""
    return str(val).strip().strip("'\"")

# SMS Configuration - Provider credentials from environment
def get_sms_config():
    """Dynamically reload and return latest SMS configuration from .env file."""
    if env_backend.exists():
        load_dotenv(dotenv_path=env_backend, override=True)
    elif env_root.exists():
        load_dotenv(dotenv_path=env_root, override=True)
    else:
        load_dotenv(override=True)

    return {
        "env_path": str(env_backend if env_backend.exists() else (env_root if env_root.exists() else "None")),
        "env_exists": env_backend.exists() or env_root.exists(),
        "TEXTBEE_API_KEY": _clean(os.environ.get("TEXTBEE_API_KEY")),
        "TEXTBEE_DEVICE_ID": _clean(os.environ.get("TEXTBEE_DEVICE_ID")),
        "SMS_RATE_LIMIT_SECONDS": int(os.environ.get("SMS_RATE_LIMIT_SECONDS", "300")),
    }
