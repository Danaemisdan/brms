import asyncio
import json
import logging
import os
import re
from typing import Optional
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes

from src.agent import run_agent, inject_system_memory
from src.config import (
    TELEGRAM_BOT_TOKEN,
    AUTHORIZED_USER_ID,
    AUTO_SEND_WITHOUT_CONFIRM,
    AUTO_CONTACT_CONFIRM,
)
from src.policy import format_preview, validate_send_request, detect_app_hints
from src.state import (
    create_pending,
    get_pending,
    remove_pending,
    get_compose,
    set_compose,
    clear_compose,
    ComposeState,
    get_last_contact,
    set_last_contact,
    get_last_app,
    set_last_app,
    get_last_message,
    set_last_message,
    get_latest_pending_for_user,
)
from src.tools import ALL_TOOLS

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)


def is_authorized(update: Update) -> bool:
    if not AUTHORIZED_USER_ID:
        logger.warning("No AUTHORIZED_USER_ID set. Allowing all users. THIS IS INSECURE.")
        return True

    user_id = update.effective_user.id
    if user_id != AUTHORIZED_USER_ID:
        logger.warning(f"Unauthorized access attempt from user: {user_id}")
        return False
    return True


async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update):
        return
    await update.message.reply_text(
        "Hello! I am your Local Manager Agent. Send a request or type /help."
    )


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update):
        return
    await update.message.reply_text(
        "Commands:\n"
        "/start - start the bot\n"
        "/help - show this message\n"
        "/approve <task_id> - approve a pending send\n"
        "/cancel <task_id> - cancel a pending send"
    )


def _parse_tool_payload(result: str):
    try:
        data = json.loads(result)
        if isinstance(data, dict) and "status" in data and "message" in data:
            return data
    except Exception:
        return None
    return None


def _should_show_ocr(text: str) -> bool:
    if not text:
        return False
    noisy_markers = ["loading model", "image slice", "decoding image", "VLM execution", "llama"]
    lower = text.lower()
    if any(m in lower for m in noisy_markers):
        return False
    compact = re.sub(r"\s+", "", text)
    if len(compact) > 2000:
        return False
    alpha = sum(1 for ch in compact if ch.isalpha())
    if len(compact) > 0 and (alpha / len(compact)) < 0.45:
        return False
    words = re.findall(r"[A-Za-z]{2,}", text)
    if len(words) < 2:
        return False
    vowel_words = sum(1 for w in words if re.search(r"[aeiouAEIOU]", w))
    if (vowel_words / max(1, len(words))) < 0.6:
        return False
    return True


def _normalize_message_body(text: str) -> str:
    if not text:
        return text
    value = text.strip()
    direct = re.match(r"^\s*(?:say|send|text|message)\s+this\s*:\s*(.+)$", value, re.IGNORECASE)
    if direct and direct.group(1).strip():
        value = direct.group(1).strip()
    else:
        lead = re.match(r"^\s*(say|text|message)\s+(.+)$", value, re.IGNORECASE)
        if lead and lead.group(2).strip():
            value = lead.group(2).strip()

    quoted = re.match(r"^\s*['\"](.+?)['\"]\s*$", value)
    if quoted and quoted.group(1).strip():
        value = quoted.group(1).strip()

    return value.strip()


def _is_send_failure_feedback(text: str) -> bool:
    if not text:
        return False
    t = text.strip().lower()
    markers = [
        "did not send",
        "didn't send",
        "not sent",
        "failed to send",
        "was not sent",
        "you didnt send",
        "you didn't send",
        "not delivered",
    ]
    return any(m in t for m in markers)


def _prepare_send_args(args: dict, contact_confirm: Optional[bool] = None) -> dict:
    out = dict(args)
    app = str(out.get("app_name", "")).strip()
    app_lower = app.lower()
    if app_lower in {"messages", "imessage", "i message"}:
        out["app_name"] = "iMessage"
    elif app_lower == "slack":
        out["app_name"] = "Slack"
    elif app_lower == "whatsapp":
        out["app_name"] = "WhatsApp"

    out["message"] = _normalize_message_body(str(out.get("message", ""))).strip()

    if contact_confirm is None:
        contact_confirm = AUTO_CONTACT_CONFIRM

    if str(out.get("app_name", "")).lower() == "whatsapp":
        if contact_confirm:
            out["confirm_contact_only"] = True
            out.pop("assume_chat_open", None)
            out.pop("force_send", None)
        else:
            out["confirm_contact_only"] = False
    return out


def _extract_contact_message(text: str):
    if not text:
        return None, None
    contact = None
    message = None

    patterns = [
        r"\bto\s+(?P<contact>.+?)\s+(?:saying|that)\s+(?P<message>.+)",
        r"\bto\s+(?P<contact>.+?)\s*:\s*(?P<message>.+)",
        r"\bmessage\s+(?P<contact>.+?)\s*:\s*(?P<message>.+)",
        r"\btext\s+(?P<contact>.+?)\s*:\s*(?P<message>.+)",
        r"\bdm\s+(?P<contact>.+?)\s*:\s*(?P<message>.+)",
        r"\bmessage\s+(?!to\b)(?P<contact>.+?)\s+(?P<message>.+)",
        r"\btext\s+(?!to\b)(?P<contact>.+?)\s+(?P<message>.+)",
        r"\bdm\s+(?!to\b)(?P<contact>.+?)\s+(?P<message>.+)",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            contact = m.group("contact").strip()
            message = m.group("message").strip()
            break

    quotes = re.findall(r"\"([^\"]+)\"|'([^']+)'", text)
    if quotes and not message:
        message = next((q[0] or q[1] for q in quotes if (q[0] or q[1])), None)

    # contact after 'to' if not captured
    if not contact:
        m = re.search(r"\bto\s+([^:]+?)(?:\s+saying\b|\s+that\b|\s+with\b|\s*$)", text, re.IGNORECASE)
        if m:
            contact = m.group(1).strip()

    # handle "message to X" without message body
    if not message and not contact:
        m = re.search(r"\bmessage\s+to\s+([^\?\.!]+)", text, re.IGNORECASE)
        if m:
            contact = m.group(1).strip()

    # message after ':' if present
    if ":" in text and not message:
        parts = text.split(":", 1)
        if len(parts) == 2 and len(parts[1].strip()) > 0:
            message = parts[1].strip()

    # Handle "message to X on WhatsApp" (no message content)
    if contact and not message:
        contact = re.sub(r"\bon\s+(whatsapp|slack|imessage|messages)\b", "", contact, flags=re.IGNORECASE).strip()

    # strip app hints from contact
    if contact:
        contact = re.sub(r"\b(on|via)\s+(whatsapp|slack|imessage|messages)\b", "", contact, flags=re.IGNORECASE).strip()
        contact = contact.strip(" :.-?!")
        contact = re.sub(r"[\\?!.]+$", "", contact).strip()
        invalid_contacts = {
            "to", "on", "via", "in",
            "whatsapp", "slack", "imessage", "messages",
            "send", "message", "send message", "a message",
        }
        # Ambiguous / non-specific references that are NOT real contact names
        ambiguous_patterns = re.compile(
            r"^(my\s+)?(friend|buddy|bro|brother|sister|sis|mom|mum|mother|"
            r"dad|father|papa|uncle|aunt|cousin|boss|colleague|"
            r"roommate|partner|girlfriend|boyfriend|gf|bf|babe|baby|"
            r"bestie|homie|dude|guy|girl|someone|somebody|a friend|"
            r"that person|that guy|that girl|him|her|them)$",
            re.IGNORECASE,
        )
        if contact.lower() in invalid_contacts:
            contact = None
        elif ambiguous_patterns.match(contact.strip()):
            contact = None
        elif re.match(r"^(send|message|text|dm)\b", contact.lower()):
            contact = None

    if message:
        message = re.sub(r"^\s*that\s+", "", message, flags=re.IGNORECASE).strip()
        message = re.sub(r"\bon\s+(whatsapp|slack|imessage|messages)\b", "", message, flags=re.IGNORECASE).strip()
        if message.lower() in {"whatsapp", "slack", "imessage", "messages"}:
            message = None
        if message and message.endswith("?") and len(message.split()) <= 5:
            # likely a question about the app, not the message body
            message = None
        if message:
            message = _normalize_message_body(message)

    return contact, message


def _is_send_intent(text: str) -> bool:
    if not text:
        return False
    t = text.lower()
    return any(k in t for k in ["send a message", "send message", "message", "text", "dm"])


def _is_updates_intent(text: str) -> bool:
    if not text:
        return False
    t = text.lower()
    has_updates = "update" in t or "updates" in t
    has_action = any(k in t for k in ["ask", "check", "follow up", "follow-up", "ping", "status"])
    return has_updates and has_action


def _extract_updates_contact(text: str) -> Optional[str]:
    if not text:
        return None
    patterns = [
        r"\bfrom\s+([a-zA-Z][a-zA-Z0-9 ._-]{1,60})",
        r"\bto\s+([a-zA-Z][a-zA-Z0-9 ._-]{1,60})",
        r"\bask\s+([a-zA-Z][a-zA-Z0-9 ._-]{1,60})\s+for\s+updates",
    ]
    for pat in patterns:
        m = re.search(pat, text, re.IGNORECASE)
        if m:
            val = m.group(1)
            val = re.sub(r"\b(on|via)\s+(whatsapp|slack|imessage|messages)\b", "", val, flags=re.IGNORECASE).strip()
            val = val.strip(" :.-?!")
            if val:
                return val
    return None


def _build_updates_message(contact_name: str) -> str:
    return f"Hey {contact_name}, can you share your latest updates?"


def _strip_revision_prefix(text: str) -> str:
    if not text:
        return text
    cleaned = re.sub(r"^\s*(no|nope|nah|instead|actually|rather)\b[\s,:-]*", "", text.strip(), flags=re.IGNORECASE)
    return cleaned.strip()


def _normalize_yes_no(text: str) -> Optional[bool]:
    if not text:
        return None
    t = text.strip().lower()
    if t in {"yes", "y", "ok", "okay", "approve", "send", "go ahead", "do it"}:
        return True
    if t in {"no", "n", "cancel", "stop", "dont", "don't"}:
        return False
    return None


async def _send_screenshot(context: ContextTypes.DEFAULT_TYPE, chat_id: int, path: str) -> None:
    if not path or not os.path.exists(path):
        return
    try:
        with open(path, "rb") as fh:
            await context.bot.send_photo(chat_id=chat_id, photo=fh)
    except Exception as exc:
        await context.bot.send_message(chat_id=chat_id, text=f"Failed to send screenshot: {exc}")


async def _execute_send_direct(update: Update, context: ContextTypes.DEFAULT_TYPE, args: dict) -> None:
    current_args = dict(args)
    max_steps = 3
    for step in range(max_steps):
        await context.bot.send_chat_action(chat_id=update.effective_chat.id, action='typing')

        def _run_tool():
            tool = ALL_TOOLS.get("send_message_macos")
            if not tool:
                return "Unknown tool: send_message_macos"
            try:
                return tool(**current_args)
            except Exception as exc:
                return f"Tool execution error: {exc}"

        result = await asyncio.to_thread(_run_tool)
        payload = _parse_tool_payload(result)
        if not payload:
            await update.message.reply_text(result)
            return

        await _send_screenshot(context, update.effective_chat.id, payload.get("screenshot_path"))
        if _should_show_ocr(payload.get("ocr_text", "")):
            await update.message.reply_text(f"OCR text:\n{payload.get('ocr_text')}")

        status = payload.get("status")
        if status == "ok":
            set_last_contact(update.effective_user.id, current_args.get("contact_name", ""))
            set_last_app(update.effective_user.id, current_args.get("app_name", ""))
            set_last_message(update.effective_user.id, current_args.get("message", ""))
            await update.message.reply_text(payload.get("message", "Done."))
            return

        if status == "confirm_contact":
            # Auto-continue: confirmed chat preview -> send without asking user.
            current_args = _prepare_send_args(current_args, contact_confirm=False)
            current_args["assume_chat_open"] = True
            current_args["force_send"] = True
            if step < max_steps - 1:
                continue

        if status == "needs_login":
            await update.message.reply_text(
                "🔐 WhatsApp Web needs you to log in.\n"
                "A Chrome window should have opened with a QR code.\n"
                "Please scan it with your phone, then send your message again."
            )
            return

        if status == "needs_attention" and step < max_steps - 1:
            # Retry once with a stronger send path.
            current_args = _prepare_send_args(current_args, contact_confirm=False)
            current_args["force_send"] = True
            current_args["assume_chat_open"] = False
            await update.message.reply_text("Retrying send automatically...")
            continue

        await update.message.reply_text(payload.get("message", "Done."))
        return


async def _handle_approval(update: Update, context: ContextTypes.DEFAULT_TYPE, task_id: str) -> None:
    task = get_pending(task_id)
    if not task or task.user_id != update.effective_user.id:
        await update.message.reply_text("No pending task found for that ID.")
        return

    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action='typing')

    def _run_tool():
        tool = ALL_TOOLS.get(task.tool_name)
        if not tool:
            return f"Unknown tool: {task.tool_name}"
        if task.tool_name == "send_message_macos":
            ok, msg = validate_send_request(
                task.arguments.get("app_name", ""),
                task.arguments.get("contact_name", ""),
                task.arguments.get("message", ""),
            )
            if not ok:
                return f"Invalid send request: {msg}"
        try:
            return tool(**task.arguments)
        except Exception as exc:
            return f"Tool execution error: {exc}"

    result = await asyncio.to_thread(_run_tool)
    remove_pending(task_id)

    payload = _parse_tool_payload(result)
    if payload:
        await _send_screenshot(context, update.effective_chat.id, payload.get("screenshot_path"))
        if _should_show_ocr(payload.get("ocr_text", "")):
            await update.message.reply_text(f"OCR text:\n{payload.get('ocr_text')}")
        if payload.get("status") == "confirm_contact":
            next_args = _prepare_send_args(task.arguments, contact_confirm=False)
            next_args["assume_chat_open"] = True
            next_args["force_send"] = True
            followup = create_pending(
                user_id=update.effective_user.id,
                chat_id=update.effective_chat.id,
                tool_name=task.tool_name,
                arguments=next_args,
                preview="Contact found. Send now?",
            )
            await update.message.reply_text(
                f"{payload.get('message', 'I found this chat. Is this the right contact?')}\n\n"
                f"Reply with /approve {followup.task_id}, /cancel {followup.task_id}, or simply 'yes'/'no'."
            )
            return
        if payload.get("status") == "ok":
            set_last_contact(update.effective_user.id, task.arguments.get("contact_name", ""))
            set_last_app(update.effective_user.id, task.arguments.get("app_name", ""))
            set_last_message(update.effective_user.id, task.arguments.get("message", ""))
        if payload.get("status") == "select_candidate":
            candidates = payload.get("candidates", [])
            lines = []
            for idx, cand in enumerate(candidates[:15], start=1):
                label = str(cand.get("label") or "candidate").strip()
                if len(label) > 100:
                    label = label[:97] + "..."
                conf = cand.get("confidence")
                if conf is None:
                    conf = 0.0
                lines.append(f"{idx}. {label} (conf {conf:.2f})")
            
            if len(candidates) > 15:
                lines.append(f"...and {len(candidates) - 15} more.")
            
            msg_text = (
                "Multiple matches found in keyboard-only mode:\n"
                + "\n".join(lines)
                + "\n\nSend a more specific contact name (full name or phone number)."
            )
            if len(msg_text) > 4000:
                msg_text = msg_text[:3997] + "..."
            await update.message.reply_text(msg_text)
            return
        if payload.get("status") == "needs_attention":
            next_args = dict(task.arguments)
            next_args["force_send"] = True
            next_args["assume_chat_open"] = True
            followup = create_pending(
                user_id=update.effective_user.id,
                chat_id=update.effective_chat.id,
                tool_name=task.tool_name,
                arguments=next_args,
                preview="Contact verification needed. Send anyway?",
            )
            await update.message.reply_text(
                f"{payload.get('message', 'Contact not confirmed.')}\n\n"
                "Open the correct chat in the app, then reply:\n"
                f"/approve {followup.task_id} to send, or /cancel {followup.task_id}."
            )
            return
        await update.message.reply_text(payload.get("message", "Done."))
        return

    await update.message.reply_text(result)


async def approve_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update):
        return
    if not context.args:
        await update.message.reply_text("Usage: /approve <task_id>")
        return
    task_id = context.args[0]
    await _handle_approval(update, context, task_id)


async def pick_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update):
        return
    await update.message.reply_text("`/pick` is disabled in keyboard-only mode. Send a more specific contact name.")


async def scroll_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update):
        return
    await update.message.reply_text("`/scroll` is disabled in keyboard-only mode. Send a more specific contact name.")


async def cancel_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update):
        return
    if not context.args:
        await update.message.reply_text("Usage: /cancel <task_id>")
        return
    task_id = context.args[0]
    task = get_pending(task_id)
    if not task or task.user_id != update.effective_user.id:
        await update.message.reply_text("No pending task found for that ID.")
        return
    remove_pending(task_id)
    inject_system_memory(update.effective_user.id, "User cancelled the tool execution.")
    await update.message.reply_text("Cancelled pending task.")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update):
        return

    user_text = update.message.text
    user_id = update.effective_user.id
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action='typing')

    # Quick shortcuts for pending tasks (yes/no or number)
    yn = _normalize_yes_no(user_text or "")
    if yn is not None:
        task = get_latest_pending_for_user(user_id)
        if task:
            if task.tool_name == "select_candidate":
                await update.message.reply_text("This action requires you to pick a candidate number, not 'yes' or 'no'. Please reply with a number (e.g. 1) or /cancel.")
                return
            if yn:
                await _handle_approval(update, context, task.task_id)
                inject_system_memory(user_id, "User approved the action and the tool started executing.")
            else:
                remove_pending(task.task_id)
                await update.message.reply_text("Cancelled pending task.")
                inject_system_memory(user_id, "User cancelled the tool execution.")
            return

    if _is_send_failure_feedback(user_text or ""):
        last_app = get_last_app(user_id)
        last_contact = get_last_contact(user_id)
        last_message = get_last_message(user_id)
        if last_app and last_contact and last_message:
            args = _prepare_send_args(
                {
                    "app_name": last_app,
                    "contact_name": last_contact,
                    "message": last_message,
                }
            )
            if AUTO_SEND_WITHOUT_CONFIRM:
                await update.message.reply_text("Got it. Retrying previous send now...")
                await _execute_send_direct(update, context, args)
            else:
                task = create_pending(
                    user_id=user_id,
                    chat_id=update.effective_chat.id,
                    tool_name="send_message_macos",
                    arguments=args,
                    preview="Retry previous send",
                )
                preview = format_preview(args["app_name"], args["contact_name"], args["message"])
                await update.message.reply_text(
                    "Got it. I can retry the previous message:\n"
                    f"{preview}\n\nReply with /approve {task.task_id}, /cancel {task.task_id}, or simply 'yes'/'no'."
                )
            return

    pending_send = get_latest_pending_for_user(user_id, tool_name="send_message_macos")
    if pending_send and user_text and not (user_text or "").strip().startswith("/"):
        revised_text = _strip_revision_prefix(user_text or "")
        updated_args = dict(pending_send.arguments)

        hints = detect_app_hints(revised_text)
        if hints:
            updated_args["app_name"] = "WhatsApp" if hints[0] == "whatsapp" else ("Slack" if hints[0] == "slack" else "Messages")

        if _is_updates_intent(revised_text):
            new_contact = _extract_updates_contact(revised_text) or updated_args.get("contact_name", "")
            if new_contact:
                updated_args["contact_name"] = new_contact
                if _extract_updates_contact(revised_text):
                    updated_args["message"] = _build_updates_message(new_contact)
                else:
                    updated_args["message"] = revised_text
        else:
            new_contact, new_message = _extract_contact_message(revised_text)
            if new_contact:
                updated_args["contact_name"] = new_contact
            if new_message:
                updated_args["message"] = _normalize_message_body(new_message)
            else:
                direct_msg = re.search(r"^\s*(?:send|say)\s+this\s*:\s*(.+)$", revised_text, re.IGNORECASE)
                if direct_msg and direct_msg.group(1).strip():
                    updated_args["message"] = _normalize_message_body(direct_msg.group(1).strip())
                elif revised_text and not _is_send_intent(revised_text):
                    updated_args["message"] = _normalize_message_body(revised_text)

        updated_args = _prepare_send_args(updated_args)

        ok, msg = validate_send_request(
            updated_args.get("app_name", ""),
            updated_args.get("contact_name", ""),
            updated_args.get("message", ""),
        )
        if ok and updated_args != pending_send.arguments:
            remove_pending(pending_send.task_id)
            set_last_contact(user_id, updated_args.get("contact_name", ""))
            set_last_app(user_id, updated_args.get("app_name", ""))
            set_last_message(user_id, updated_args.get("message", ""))
            if AUTO_SEND_WITHOUT_CONFIRM:
                await update.message.reply_text("Updated draft received. Sending now...")
                await _execute_send_direct(update, context, updated_args)
            else:
                task = create_pending(
                    user_id=user_id,
                    chat_id=update.effective_chat.id,
                    tool_name="send_message_macos",
                    arguments=updated_args,
                    preview="Approval required",
                )
                preview = format_preview(
                    task.arguments.get("app_name"),
                    task.arguments.get("contact_name"),
                    task.arguments.get("message"),
                )
                await update.message.reply_text(
                    "Updated draft:\n"
                    f"{preview}\n\nReply with /approve {task.task_id}, /cancel {task.task_id}, or simply 'yes'/'no'."
                )
            return

    if user_text and user_text.strip().isdigit():
        task = get_latest_pending_for_user(user_id, tool_name="select_candidate")
        if task:
            context.args = [task.task_id, user_text.strip()]
            await pick_command(update, context)
            return

    compose = get_compose(user_id)
    if compose:
        hints = detect_app_hints(user_text or "")
        if not compose.app_name and hints:
            compose.app_name = "WhatsApp" if hints[0] == "whatsapp" else ("Slack" if hints[0] == "slack" else "Messages")
        elif not compose.app_name:
            compose.app_name = get_last_app(user_id) or "WhatsApp"

        if not compose.contact_name:
            compose.contact_name = (user_text or "").strip()
        elif not compose.message:
            compose.message = _normalize_message_body((user_text or "").strip())

        set_compose(compose)
        if compose.app_name and compose.contact_name and compose.message:
            clear_compose(user_id)
            args = {
                "app_name": compose.app_name,
                "contact_name": compose.contact_name,
                "message": compose.message,
            }
            args = _prepare_send_args(args)
            ok, msg = validate_send_request(args["app_name"], args["contact_name"], args["message"])
            if not ok:
                await update.message.reply_text(f"Invalid request: {msg}")
                return
            set_last_contact(user_id, args["contact_name"])
            set_last_app(user_id, args["app_name"])
            set_last_message(user_id, args["message"])
            if AUTO_SEND_WITHOUT_CONFIRM:
                await update.message.reply_text("Got it. Sending now...")
                await _execute_send_direct(update, context, args)
            else:
                task = create_pending(
                    user_id=user_id,
                    chat_id=update.effective_chat.id,
                    tool_name="send_message_macos",
                    arguments=args,
                    preview="Approval required",
                )
                preview = format_preview(args["app_name"], args["contact_name"], args["message"])
                await update.message.reply_text(
                    f"{preview}\n\nReply with /approve {task.task_id}, /cancel {task.task_id}, or simply 'yes'/'no'."
                )
            return

        if not compose.contact_name:
            await update.message.reply_text("Who should I message?")
        elif not compose.message:
            await update.message.reply_text("What should I say?")
        return

    if _is_updates_intent(user_text or ""):
        hints = detect_app_hints(user_text or "")
        app_name = "WhatsApp" if not hints else ("WhatsApp" if hints[0] == "whatsapp" else ("Slack" if hints[0] == "slack" else "Messages"))
        if not hints:
            app_name = get_last_app(user_id) or app_name
        contact = _extract_updates_contact(user_text or "")
        if not contact:
            set_compose(ComposeState(user_id=user_id, app_name=app_name))
            await update.message.reply_text("Who should I ask for updates?")
            return
        message = _build_updates_message(contact)
        args = {"app_name": app_name, "contact_name": contact, "message": message}
        args = _prepare_send_args(args)
        ok, msg = validate_send_request(args["app_name"], args["contact_name"], args["message"])
        if not ok:
            await update.message.reply_text(f"Invalid request: {msg}")
            return
        set_last_contact(user_id, args["contact_name"])
        set_last_app(user_id, args["app_name"])
        set_last_message(user_id, args["message"])
        if AUTO_SEND_WITHOUT_CONFIRM:
            await update.message.reply_text("Got it. Sending now...")
            await _execute_send_direct(update, context, args)
        else:
            task = create_pending(
                user_id=user_id,
                chat_id=update.effective_chat.id,
                tool_name="send_message_macos",
                arguments=args,
                preview="Approval required",
            )
            preview = format_preview(args["app_name"], args["contact_name"], args["message"])
            await update.message.reply_text(
                f"{preview}\n\nReply with /approve {task.task_id}, /cancel {task.task_id}, or simply 'yes'/'no'."
            )
        return

    if _is_send_intent(user_text or ""):
        hints = detect_app_hints(user_text or "")
        app_name = "WhatsApp" if not hints else ("WhatsApp" if hints[0] == "whatsapp" else ("Slack" if hints[0] == "slack" else "Messages"))
        if not hints:
            app_name = get_last_app(user_id) or app_name
        contact, message = _extract_contact_message(user_text or "")
        if not contact and not message:
            set_compose(ComposeState(user_id=user_id, app_name=app_name))
            await update.message.reply_text("Who should I message?")
            return
        if contact and not message:
            set_compose(ComposeState(user_id=user_id, app_name=app_name, contact_name=contact))
            await update.message.reply_text("What should I say?")
            return
        if not contact and message:
            set_compose(ComposeState(user_id=user_id, app_name=app_name, message=_normalize_message_body(message)))
            await update.message.reply_text("Who should I message?")
            return
        args = {"app_name": app_name, "contact_name": contact, "message": _normalize_message_body(message)}
        args = _prepare_send_args(args)
        ok, msg = validate_send_request(args["app_name"], args["contact_name"], args["message"])
        if not ok:
            await update.message.reply_text(f"Invalid request: {msg}")
            return
        set_last_contact(user_id, args["contact_name"])
        set_last_app(user_id, args["app_name"])
        set_last_message(user_id, args["message"])
        if AUTO_SEND_WITHOUT_CONFIRM:
            await update.message.reply_text("Got it. Sending now...")
            await _execute_send_direct(update, context, args)
        else:
            task = create_pending(
                user_id=user_id,
                chat_id=update.effective_chat.id,
                tool_name="send_message_macos",
                arguments=args,
                preview="Approval required",
            )
            preview = format_preview(args["app_name"], args["contact_name"], args["message"])
            await update.message.reply_text(
                f"{preview}\n\nReply with /approve {task.task_id}, /cancel {task.task_id}, or simply 'yes'/'no'."
            )
        return

    loop = asyncio.get_running_loop()

    def status_cb(msg: str):
        asyncio.run_coroutine_threadsafe(update.message.reply_text(msg), loop)

    result = await asyncio.to_thread(run_agent, user_id, user_text, status_cb)

    if result.type == "confirm":
        call = dict(result.tool_call or {})
        if call.get("tool_name") == "send_message_macos":
            call["arguments"] = _prepare_send_args(call.get("arguments", {}))
            if AUTO_SEND_WITHOUT_CONFIRM:
                await update.message.reply_text("Got it. Sending now...")
                await _execute_send_direct(update, context, call.get("arguments", {}))
                return
        task = create_pending(
            user_id=user_id,
            chat_id=update.effective_chat.id,
            tool_name=call["tool_name"],
            arguments=call.get("arguments", {}),
            preview=result.content,
        )
        preview = format_preview(
            task.arguments.get("app_name"),
            task.arguments.get("contact_name"),
            task.arguments.get("message"),
        )
        if call.get("tool_name") == "send_message_macos":
            set_last_contact(user_id, task.arguments.get("contact_name", ""))
            set_last_app(user_id, task.arguments.get("app_name", ""))
            set_last_message(user_id, task.arguments.get("message", ""))
        await update.message.reply_text(
            f"{preview}\n\nReply with /approve {task.task_id}, /cancel {task.task_id}, or simply 'yes'/'no'."
        )
        return

    await update.message.reply_text(result.content)


async def handle_photo(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    if not is_authorized(update):
        return

    user_id = update.effective_user.id
    await context.bot.send_chat_action(chat_id=update.effective_chat.id, action='typing')

    photo_file = await update.message.photo[-1].get_file()
    
    import tempfile
    import os
    ext = os.path.splitext(photo_file.file_path)[1] if photo_file.file_path else ".jpg"
    fd, path = tempfile.mkstemp(suffix=ext)
    os.close(fd)
    
    await photo_file.download_to_drive(path)
    
    caption = update.message.caption or ""
    user_text = caption + f" [IMAGE: {path}]"
    
    loop = asyncio.get_running_loop()
    def status_cb(msg: str):
        asyncio.run_coroutine_threadsafe(update.message.reply_text(msg), loop)

    result = await asyncio.to_thread(run_agent, user_id, user_text, status_cb)

    if result.type == "confirm":
        # Handle same as text messages for confirmation
        call = dict(result.tool_call or {})
        task = create_pending(
            user_id=user_id,
            chat_id=update.effective_chat.id,
            tool_name=call["tool_name"],
            arguments=call.get("arguments", {}),
            preview=result.content,
        )
        await update.message.reply_text(
            f"{result.content}\n\nReply with /approve {task.task_id}, /cancel {task.task_id}, or simply 'yes'/'no'."
        )
        return

    await update.message.reply_text(result.content)


def build_app() -> Application:
    if not TELEGRAM_BOT_TOKEN:
        raise ValueError("TELEGRAM_BOT_TOKEN is missing in the environment.")

    application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("help", help_command))
    application.add_handler(CommandHandler("approve", approve_command))
    application.add_handler(CommandHandler("cancel", cancel_command))
    application.add_handler(CommandHandler("pick", pick_command))
    application.add_handler(CommandHandler("scroll", scroll_command))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    application.add_handler(MessageHandler(filters.PHOTO, handle_photo))

    return application

