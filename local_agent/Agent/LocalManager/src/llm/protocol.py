import json
from typing import Optional, Tuple


def _strip_code_fence(text: str) -> str:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        if len(lines) >= 2:
            return "\n".join(lines[1:-1]).strip()
    return text


def _extract_json(text: str) -> Optional[str]:
    text = _strip_code_fence(text)
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        return None
    return text[start : end + 1]


def parse_llm_response(text: str) -> Tuple[Optional[dict], Optional[str]]:
    raw = _extract_json(text)
    if not raw:
        return None, "No JSON object found in model output."
    try:
        return json.loads(raw), None
    except json.JSONDecodeError as exc:
        return None, f"Invalid JSON from model: {exc}"


def validate_tool_call(payload: dict, tool_names: set) -> Tuple[bool, Optional[str]]:
    if not isinstance(payload, dict):
        return False, "Payload is not a JSON object."
    if payload.get("type") != "tool_call":
        return False, "Payload is not a tool_call."
    name = payload.get("tool_name")
    if not name or not isinstance(name, str):
        return False, "tool_name is missing or invalid."
    if name not in tool_names:
        return False, f"Unknown tool_name: {name}"
    args = payload.get("arguments")
    if args is None or not isinstance(args, dict):
        return False, "arguments must be a JSON object."
    return True, None
