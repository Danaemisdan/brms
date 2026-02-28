import os
from dotenv import load_dotenv

load_dotenv()

def _get_bool(value: str, default: bool = False) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "y", "on"}

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
AUTHORIZED_USER_ID = int(os.getenv("AUTHORIZED_USER_ID", 0)) if os.getenv("AUTHORIZED_USER_ID") else None

LLM_BACKEND = os.getenv("LLM_BACKEND", "llama_cpp")
LLAMA_CPP_BASE_URL = os.getenv("LLAMA_CPP_BASE_URL", "http://127.0.0.1:8080")
LLAMA_CPP_MODEL = os.getenv("LLAMA_CPP_MODEL", "local-model")
LLM_TEMPERATURE = float(os.getenv("LLM_TEMPERATURE", "0.2"))
LLM_MAX_TOKENS = int(os.getenv("LLM_MAX_TOKENS", "512"))
MAX_TOOL_STEPS = int(os.getenv("MAX_TOOL_STEPS", "6"))

SEARCH_MAX_RESULTS = int(os.getenv("SEARCH_MAX_RESULTS", "3"))

UI_STEALTH_MODE = os.getenv("UI_STEALTH_MODE", "applescript_then_cursor")
CONFIRM_SEND = _get_bool(os.getenv("CONFIRM_SEND", "false"), default=False)
AUTO_SEND_WITHOUT_CONFIRM = _get_bool(os.getenv("AUTO_SEND_WITHOUT_CONFIRM", "true"), default=True)
AUTO_CONTACT_CONFIRM = _get_bool(os.getenv("AUTO_CONTACT_CONFIRM", "false"), default=False)
MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", "1000"))

_allowed_apps_raw = os.getenv("ALLOWED_APPS", "whatsapp,slack,imessage,messages")
ALLOWED_APPS = {app.strip().lower() for app in _allowed_apps_raw.split(",") if app.strip()}

VLM_ENABLED = _get_bool(os.getenv("VLM_ENABLED", "false"), default=False)
VLM_CLI_PATH = os.getenv("VLM_CLI_PATH", "/opt/homebrew/bin/llama-mtmd-cli")
VLM_MODEL = os.getenv("VLM_MODEL", "")
VLM_MMPROJ = os.getenv("VLM_MMPROJ", "")
VLM_CONFIDENCE_THRESHOLD = float(os.getenv("VLM_CONFIDENCE_THRESHOLD", "0.4"))
VLM_MAX_CANDIDATES = int(os.getenv("VLM_MAX_CANDIDATES", "25"))
VLM_MAX_DIM = int(os.getenv("VLM_MAX_DIM", "640"))
