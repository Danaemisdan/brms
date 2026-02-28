import json
from dataclasses import dataclass
from typing import Callable, Optional, Dict, List

from src.ai import chat
from src.config import MAX_TOOL_STEPS
from src.llm.protocol import parse_llm_response, validate_tool_call
from src.policy import should_confirm_send, validate_send_request, format_preview, detect_app_hints
from src.tools import ALL_TOOLS_SCHEMA, ALL_TOOLS


@dataclass
class AgentResult:
    type: str
    content: str
    tool_call: Optional[dict] = None


SESSION_MEMORY: Dict[int, List[dict]] = {}


def inject_system_memory(user_id: int, text: str):
    if user_id in SESSION_MEMORY:
        SESSION_MEMORY[user_id].append({"role": "system", "content": text})


def _build_system_prompt() -> str:
    tools_json = json.dumps(ALL_TOOLS_SCHEMA, indent=2)
    return (
        "You are a conversational local manager agent running on macOS.\n"
        "You must respond with ONLY a JSON object, no extra text.\n\n"
        "RESPONSE FORMATS (pick exactly one):\n"
        '1. Tool call: {"type":"tool_call","tool_name":"...","arguments":{...}}\n'
        '2. Talk to user: {"type":"final","content":"your text here"}\n\n'
        "ARGUMENT EXTRACTION RULES:\n"
        "- contact_name: ONLY the person's name, nothing else.\n"
        "- message: ONLY the message body. Strip 'saying', 'tell him', 'say that' etc.\n"
        "- app_name: whatsapp, slack, imessage. Default to whatsapp if user says 'message' or 'WhatsApp'.\n"
        "- product_url: Provide the full URL for Amazon queries.\n"
        "- review_image_path: Always extract the path starting with '/tmp/' if the user provides an [IMAGE: ...] tag.\n\n"
        "EXAMPLES:\n"
        'User: "Send a message to Iba saying I love her"\n'
        '→ {"type":"tool_call","tool_name":"send_message_macos","arguments":{"app_name":"whatsapp","contact_name":"Iba","message":"I love her"}}\n\n'
        'User: "Check if this review exists on https://amazon.com/dp/123 [IMAGE: /tmp/img.jpg]"\n'
        '→ {"type":"tool_call","tool_name":"verify_amazon_review","arguments":{"product_url":"https://amazon.com/dp/123","review_image_path":"/tmp/img.jpg"}}\n\n'
        'User: "Message Jagadeesh on WhatsApp saying fuck you"\n'
        '→ {"type":"tool_call","tool_name":"send_message_macos","arguments":{"app_name":"whatsapp","contact_name":"Jagadeesh","message":"fuck you"}}\n\n'
        'User: "Tell Ravi on Slack that the meeting is at 3pm"\n'
        '→ {"type":"tool_call","tool_name":"send_message_macos","arguments":{"app_name":"slack","contact_name":"Ravi","message":"the meeting is at 3pm"}}\n\n'
        'User: "Hey"\n'
        '→ {"type":"final","content":"Hello! How can I assist you today?"}\n\n'
        'User: "Can you send a message?"\n'
        '→ {"type":"final","content":"Sure! Who should I message and what should I say?"}\n\n'
        "NEVER guess or hallucinate contact names, messages, or image paths. If missing info, ask.\n"
        "NEVER include the command words (send, message, saying, tell) in the message body or contact_name.\n\n"
        f"Available tools:\n{tools_json}"
    )


def run_agent(user_id: int, user_text: str, status_cb: Optional[Callable[[str], None]] = None) -> AgentResult:
    def _status(msg: str):
        if status_cb:
            status_cb(msg)

    _status("Thinking...")
    if user_id not in SESSION_MEMORY:
        SESSION_MEMORY[user_id] = [
            {"role": "system", "content": _build_system_prompt()}
        ]
    else:
        # Force update the system prompt so we get deploying fixes mid-conversation
        if SESSION_MEMORY[user_id] and SESSION_MEMORY[user_id][0].get("role") == "system":
            SESSION_MEMORY[user_id][0]["content"] = _build_system_prompt()
        
    messages = SESSION_MEMORY[user_id]
    messages.append({"role": "user", "content": user_text})

    # Avoid context overflow (keep system prompt at index 0)
    if len(messages) > 15:
        messages = [messages[0]] + messages[-14:]
        SESSION_MEMORY[user_id] = messages

    for _ in range(MAX_TOOL_STEPS):
        response = chat(messages)
        messages.append({"role": "assistant", "content": response})
        
        payload, err = parse_llm_response(response)
        if err:
            # If the LLM just said "final", don't expose that raw text to the user.
            fallback_msg = "I'm having trouble formatting my response. Could you please rephrase?"
            if len(response) > 10 and "{" not in response:
                fallback_msg = response  # It might be a legit conversational reply that forgot JSON
            return AgentResult(type="final", content=fallback_msg)

        if payload.get("type") == "final":
            return AgentResult(type="final", content=str(payload.get("content", "")))

        if payload.get("type") != "tool_call":
            if "content" in payload and isinstance(payload.get("content"), str):
                return AgentResult(type="final", content=payload["content"])
            if "message" in payload and isinstance(payload.get("message"), str):
                return AgentResult(type="final", content=payload["message"])
            return AgentResult(type="final", content="Invalid response from model. Please try again.")

        valid, tool_err = validate_tool_call(payload, set(ALL_TOOLS.keys()))
        if not valid:
            messages.append({"role": "system", "content": f"System error validating tool call: {tool_err}. Please ask the user for clarification."})
            continue

        tool_name = payload["tool_name"]
        args = payload.get("arguments", {})

        if tool_name == "send_message_macos":
            contact_check = str(args.get("contact_name", "")).lower()
            msg_check = str(args.get("message", "")).lower()
            if "example" in contact_check or "test" in contact_check or "example" in msg_check or "test" in msg_check or not contact_check or not msg_check:
                messages.append({
                    "role": "system", 
                    "content": "SYSTEM REJECTION: You hallucinated fake arguments (example/test) or left them empty. "
                               "DO NOT call the tool again. Instead, output {\"type\": \"final\", \"content\": \"Who do you want to message and what should I say?\"}"
                })
                continue

        if tool_name == "send_message_macos" and should_confirm_send():
            ok, msg = validate_send_request(
                args.get("app_name", ""),
                args.get("contact_name", ""),
                args.get("message", ""),
            )
            if not ok:
                messages.append({"role": "system", "content": f"Validation failed: {msg}. Ask the user for clarification."})
                continue
                
            preview = format_preview(args.get("app_name"), args.get("contact_name"), args.get("message"))
            return AgentResult(type="confirm", content=preview, tool_call=payload)

        _status(f"Using tool: {tool_name}")
        try:
            result = ALL_TOOLS[tool_name](**args)
        except Exception as exc:
            result = f"Tool execution error: {exc}"

        messages.append({"role": "system", "content": f"Tool '{tool_name}' returned: {result}"})

    return AgentResult(type="final", content="Reached maximum tool steps without completion.")
