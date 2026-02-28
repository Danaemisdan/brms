from src.config import ALLOWED_APPS, CONFIRM_SEND, MAX_MESSAGE_LENGTH


def should_confirm_send() -> bool:
    return CONFIRM_SEND


def validate_send_request(app_name: str, contact_name: str, message: str):
    if not app_name or not contact_name or not message:
        return False, "app_name, contact_name, and message are required."
    app_key = app_name.strip().lower()
    if app_key not in ALLOWED_APPS:
        return False, f"App '{app_name}' is not allowed."
    if len(contact_name.strip()) < 1:
        return False, "contact_name cannot be empty."
    if len(message.strip()) < 1:
        return False, "message cannot be empty."
    if len(message) > MAX_MESSAGE_LENGTH:
        return False, f"message is too long (max {MAX_MESSAGE_LENGTH} chars)."
    return True, None


def format_preview(app_name: str, contact_name: str, message: str) -> str:
    return (
        "Approval required to send the following message:\n"
        f"App: {app_name}\n"
        f"To: {contact_name}\n"
        f"Message: {message}"
    )


def detect_app_hints(text: str):
    if not text:
        return []
    t = text.lower()
    hints = []
    if "whatsapp" in t or "wa" in t.split():
        hints.append("whatsapp")
    if "slack" in t:
        hints.append("slack")
    if "imessage" in t or "i message" in t or "messages app" in t or "messages" in t:
        hints.append("messages")
    # De-dup while preserving order
    seen = set()
    ordered = []
    for h in hints:
        if h not in seen:
            ordered.append(h)
            seen.add(h)
    return ordered
