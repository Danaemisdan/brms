import csv
import json
import os
import re
import shutil
import subprocess
import tempfile
import time
import uuid
from typing import Optional, Tuple

from src.config import VLM_CONFIDENCE_THRESHOLD, VLM_MAX_CANDIDATES, AUTO_CONTACT_CONFIRM
from src.vision import locate_candidates, locate_ui_element_bbox


def send_message_macos(
    app_name: str,
    contact_name: str,
    message: str,
    force_send: bool = False,
    assume_chat_open: bool = False,
    confirm_contact_only: bool = False,
) -> str:
    """
    Automates sending a message via WhatsApp or Slack on macOS using AppleScript.
    Warning: This briefly brings the app to the foreground.
    """
    app_name = app_name.lower()

    if "whatsapp" in app_name:
        return _send_whatsapp_message(
            contact_name,
            message,
            force_send=force_send,
            assume_chat_open=assume_chat_open,
            confirm_contact_only=confirm_contact_only,
        )
    if "slack" in app_name:
        return _send_slack_message(contact_name, message, force_send=force_send, assume_chat_open=assume_chat_open)
    if "messages" in app_name or "imessage" in app_name:
        return _send_imessage(contact_name, message, force_send=force_send, assume_chat_open=assume_chat_open)
    return _payload("error", f"App '{app_name}' is not currently supported for automated messaging.")


def send_message_macos_with_bbox(
    app_name: str,
    origin_x: int,
    origin_y: int,
    bbox: Tuple[int, int, int, int],
    message: str,
    contact_name: str = "",
) -> str:
    return _payload(
        "error",
        "Mouse-based selection is disabled. Use the keyboard-only WhatsApp send flow.",
        screenshot_path=_capture_fullscreen(),
    )


def get_candidate_payload(app_name: str, contact_name: str):
    left_panel = _capture_left_panel(app_name)
    if left_panel:
        panel_path, panel_x, panel_y, _, _ = left_panel
        payload = _candidate_payload_for_image(panel_path, (panel_x, panel_y), contact_name, app_name, "left_panel")
        return payload
    full = _capture_fullscreen()
    if full:
        return _candidate_payload_for_image(full, (0, 0), contact_name, app_name, "fullscreen")
    return _payload("needs_attention", "Unable to capture chat list for candidates.")


def scroll_chat_list(app_name: str, direction: str = "down", amount: int = 6) -> Optional[str]:
    try:
        import pyautogui
    except Exception as exc:
        return f"Cursor fallback requires pyautogui: {exc}"

    bounds = _get_window_bounds(app_name)
    if bounds:
        x, y, w, h = bounds
        click_x = x + int(w * 0.2)
        click_y = y + int(h * 0.3)
        pyautogui.click(click_x, click_y)
    else:
        width, height = pyautogui.size()
        pyautogui.click(int(width * 0.2), int(height * 0.3))

    scroll_amount = -500 if direction == "down" else 500
    for _ in range(max(1, amount)):
        pyautogui.scroll(scroll_amount)
        time.sleep(0.1)
    return None


def _payload(status: str, message: str, screenshot_path: Optional[str] = None, ocr_text: Optional[str] = None, used_cursor_fallback: bool = False, candidates: Optional[list] = None, origin: Optional[Tuple[int, int]] = None, source: Optional[str] = None) -> str:
    data = {
        "status": status,
        "message": message,
        "screenshot_path": screenshot_path,
        "ocr_text": ocr_text,
        "used_cursor_fallback": used_cursor_fallback,
        "candidates": candidates or [],
        "origin": origin,
        "source": source,
    }
    return json.dumps(data)


def _execute_applescript(script: str) -> str:
    try:
        result = subprocess.run(['osascript', '-e', script], capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        return f"AppleScript Error: {e.stderr}"


def _osascript_bool(script: str) -> bool:
    out = _execute_applescript(script).strip().lower()
    return out == "true"


def _escape_applescript(text: str) -> str:
    return text.replace("\\", "\\\\").replace('"', '\\"')


def _execute_chrome_js(js_code: str) -> str:
    """Execute JavaScript in the active Google Chrome tab using AppleScript."""
    js_escaped = js_code.replace('\\', '\\\\').replace('"', '\\"').replace("'", "\\'")
    script = f'''
    tell application "Google Chrome"
        if not (exists window 1) then return "Error: No Chrome window found."
        set activeTab to active tab of window 1
        tell activeTab
            execute javascript "{js_escaped}"
        end tell
    end tell
    '''
    res = _execute_applescript(script)
    if not res:
        return ""
    if "Error" in res and res.startswith("Error:"):
        return res
    if "missing value" in res.lower() or res.strip() == "":
        return ""
    return res.strip()


# ── Isolated Chromium helpers for WhatsApp Web ──────────────────────────

_WHATSAPP_AGENT_PROFILE = os.path.expanduser("~/.whatsapp-agent-chrome")

def _get_cdp_browser(p):
    import requests
    # Check if a Chrome with debugging port is already running
    try:
        requests.get("http://127.0.0.1:9222/json/version", timeout=1)
    except Exception:
        # Launch dedicated Chrome instance
        os.makedirs(_WHATSAPP_AGENT_PROFILE, exist_ok=True)
        subprocess.Popen([
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            f"--user-data-dir={_WHATSAPP_AGENT_PROFILE}",
            "--remote-debugging-port=9222",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-extensions",
            "https://web.whatsapp.com"
        ], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        
        # Wait up to 15s for port
        for _ in range(30):
            try:
                requests.get("http://127.0.0.1:9222/json/version", timeout=1)
                break
            except Exception:
                time.sleep(0.5)
                
    try:
        return p.chromium.connect_over_cdp("http://127.0.0.1:9222")
    except Exception as e:
        return str(e)


def _send_whatsapp_message(
    contact: str,
    message: str,
    force_send: bool = False,
    assume_chat_open: bool = False,
    confirm_contact_only: bool = False,
) -> str:
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
    import re

    is_phone = bool(re.match(r'^\+?\d+$', re.sub(r'[\s\-\(\)]', '', contact)))
    phone_num = re.sub(r'[^\d\+]', '', contact) if is_phone else ""

    with sync_playwright() as p:
        browser = _get_cdp_browser(p)
        if isinstance(browser, str):
            return _payload("error", f"Could not connect to WhatsApp via Chrome: {browser}")

        try:
            context = browser.contexts[0]
            
            # 1. Reuse existing Web WhatsApp tab, or create one
            wa_page = None
            for page in context.pages:
                if "web.whatsapp.com" in page.url:
                    wa_page = page
                    break
            
            if not wa_page:
                wa_page = context.new_page()
                wa_page.goto("https://web.whatsapp.com")
            
            wa_page.bring_to_front()

            # 2. Wait for Load / Login Detection
            try:
                wa_page.wait_for_selector('div[contenteditable="true"][data-tab="3"], #pane-side, canvas, :text("Log in"), :text("Scan the QR")', timeout=45000)
            except PlaywrightTimeoutError:
                return _payload("error", "Timeout waiting for WhatsApp Web to load.")

            if wa_page.locator('canvas').count() > 0 or wa_page.locator(':text("Log in")').count() > 0 or wa_page.locator(':text("Scan the QR")').count() > 0:
                return _payload("needs_login", "WhatsApp Web needs you to log in. Please scan the QR code.", screenshot_path=_capture_fullscreen())

            # 3. Navigate & Send
            if is_phone:
                from urllib.parse import quote
                url_dest = f"https://web.whatsapp.com/send?phone={phone_num}&text={quote(message)}"
                wa_page.goto(url_dest)

                try:
                    wa_page.wait_for_selector('span[data-icon="send"], :text("Phone number shared via url is invalid")', timeout=45000)
                except PlaywrightTimeoutError:
                    return _payload("error", "Timeout loading the chat for this phone number.")

                if wa_page.locator(':text("Phone number shared via url is invalid")').count() > 0:
                    return _payload("error", f"WhatsApp says the phone number {phone_num} is invalid.")

                if confirm_contact_only:
                    return _payload("confirm_contact", f"Chat opened for {contact}. Send?", screenshot_path=_capture_fullscreen())

                wa_page.locator('span[data-icon="send"]').first.click()
                time.sleep(1.5)

            else:
                search_box = wa_page.locator('div[contenteditable="true"][data-tab="3"]').first
                try:
                    search_box.wait_for(state="visible", timeout=10000)
                except PlaywrightTimeoutError:
                    return _payload("error", "Could not find WhatsApp search box.")

                search_box.click()
                search_box.press("Meta+a")
                search_box.press("Backspace")
                search_box.fill(contact)
                time.sleep(2)

                items = wa_page.locator('#pane-side div[role="listitem"]')
                count = items.count()
                if count == 0:
                    items = wa_page.locator('#pane-side > div > div > div')
                    count = items.count()
                    if count == 0:
                        return _payload("error", f"No contacts found matching '{contact}'. Try a more specific name.")

                clicked = False
                target_norm = contact.lower()
                for i in range(count):
                    item = items.nth(i)
                    title_elem = item.locator('span[title]')
                    if title_elem.count() > 0:
                        title = title_elem.first.get_attribute("title")
                        if title and target_norm in title.lower():
                            title_elem.first.click()
                            clicked = True
                            break

                if not clicked:
                    first_title = items.nth(0).locator('span[title]')
                    if first_title.count() > 0:
                        first_title.first.click()
                    else:
                        items.nth(0).click()

                time.sleep(1.5)

                if confirm_contact_only:
                    return _payload("confirm_contact", "Chat opened. Send?", screenshot_path=_capture_fullscreen())

                if not force_send and AUTO_CONTACT_CONFIRM:
                    header = wa_page.locator('header span[title]').first
                    if header.count() > 0:
                        header_title = header.get_attribute("title")
                        if header_title:
                            h_norm = _normalize(header_title)
                            c_norm = _normalize(contact)
                            if c_norm not in h_norm and not all(t in h_norm for t in c_norm.split()):
                                return _payload("needs_attention", f"Header '{header_title}' doesn't match requested contact '{contact}'.", screenshot_path=_capture_fullscreen())

                compose_box = wa_page.locator('div[contenteditable="true"][data-tab="10"]').first
                if compose_box.count() == 0:
                    all_editable = wa_page.locator('div[contenteditable="true"]')
                    for i in range(all_editable.count()):
                        el = all_editable.nth(i)
                        tab = el.get_attribute('data-tab')
                        if tab != "3":
                            compose_box = el
                            break

                if compose_box.count() == 0:
                    return _payload("error", "Could not find the message input box.")

                compose_box.click()
                compose_box.fill(message)
                time.sleep(0.5)
                compose_box.press("Enter")
                time.sleep(1.5)

            # 4. Verify message was sent
            target_msg_norm = _normalize(message)
            verified = False
            for _ in range(8):
                msgs = wa_page.locator('.message-out .copyable-text span.selectable-text')
                count = msgs.count()
                if count > 0:
                    last_msg = msgs.nth(count - 1).inner_text()
                    last_msg_norm = _normalize(last_msg)
                    if target_msg_norm in last_msg_norm or last_msg_norm in target_msg_norm:
                        verified = True
                        break
                time.sleep(1)

            if not verified:
                return _payload("error", "Could not verify message was sent based on DOM.", screenshot_path=_capture_fullscreen())

            return _payload("ok", f"✅ Message to {contact} confirmed sent natively.", screenshot_path=_capture_fullscreen())

        finally:
            if hasattr(browser, 'close'):
                browser.close()


def _should_use_cursor_fallback() -> bool:
    return False


def _wait_for_window(app_name: str, timeout: float = 20.0) -> bool:
    start = time.time()
    while time.time() - start < timeout:
        exists = _osascript_bool(
            f'tell application "System Events" to (exists (window 1 of process "{app_name}"))'
        )
        frontmost = _osascript_bool(
            f'tell application "System Events" to get frontmost of process "{app_name}"'
        )
        if exists and frontmost:
            return True
        time.sleep(0.2)
    return False


def _ensure_app_ready(app_name: str, timeout: float = 20.0) -> bool:
    subprocess.run(["open", "-a", app_name], check=False)
    return _wait_for_window(app_name, timeout=timeout)


def _get_window_bounds(app_name: str) -> Optional[Tuple[int, int, int, int]]:
    # Bring the app to the absolute front and query the frontmost process
    # so we don't have to guess its internal process name string
    script = f'''
    tell application "{app_name}" to activate
    delay 0.5
    tell application "System Events"
        set frontApp to first application process whose frontmost is true
        if not (exists window 1 of frontApp) then
            return ""
        end if
        set p to position of window 1 of frontApp
        set s to size of window 1 of frontApp
        return (item 1 of p as string) & "," & (item 2 of p as string) & "," & (item 1 of s as string) & "," & (item 2 of s as string)
    end tell
    '''
    out = _execute_applescript(script)
    if not out or "Error" in out:
        return None
    try:
        parts = [int(x.strip()) for x in out.split(",")]
        if len(parts) != 4:
            return None
        return parts[0], parts[1], parts[2], parts[3]
    except Exception:
        return None


def _capture_region(x: int, y: int, w: int, h: int) -> Optional[str]:
    path = os.path.join(tempfile.gettempdir(), f"lmgr-{uuid.uuid4().hex}.png")
    try:
        subprocess.run(["screencapture", "-x", "-R", f"{x},{y},{w},{h}", path], check=True)
        return path
    except Exception:
        return None


def _capture_fullscreen() -> Optional[str]:
    path = os.path.join(tempfile.gettempdir(), f"lmgr-full-{uuid.uuid4().hex}.png")
    try:
        subprocess.run(["screencapture", "-x", path], check=True)
        return path
    except Exception:
        return None


def _capture_window(app_name: str) -> Optional[str]:
    bounds = _get_window_bounds(app_name)
    if not bounds:
        return None
    x, y, w, h = bounds
    return _capture_region(x, y, w, h)


def _left_ratio_for_app(app_name: str) -> float:
    if app_name.lower() == "whatsapp":
        return 0.38
    if app_name.lower() == "slack":
        return 0.32
    if app_name.lower() == "messages":
        return 0.30
    return 0.35


def _capture_left_panel(app_name: str) -> Optional[Tuple[str, int, int, int, int]]:
    bounds = _get_window_bounds(app_name)
    if not bounds:
        try:
            import pyautogui
        except Exception:
            return None
        width, height = pyautogui.size()
        left_w = max(200, int(width * _left_ratio_for_app(app_name)))
        path = _capture_region(0, 0, left_w, height)
        if not path:
            return None
        return path, 0, 0, left_w, height
    x, y, w, h = bounds
    left_w = max(200, int(w * _left_ratio_for_app(app_name)))
    path = _capture_region(x, y, left_w, h)
    if not path:
        return None
    return path, x, y, left_w, h


def _capture_header_region(app_name: str) -> Optional[Tuple[str, int, int, int, int]]:
    bounds = _get_window_bounds(app_name)
    if not bounds:
        return None
    x, y, w, h = bounds
    left_w = max(200, int(w * _left_ratio_for_app(app_name)))
    header_h = min(120, max(70, int(h * 0.12)))
    hx = x + left_w
    hw = max(200, w - left_w)
    path = _capture_region(hx, y, hw, header_h)
    if not path:
        return None
    return path, hx, y, hw, header_h


def _tesseract_tsv(path: str) -> Optional[str]:
    if not shutil.which("tesseract"):
        return None
    try:
        result = subprocess.run(
            ["tesseract", path, "stdout", "--psm", "6", "-l", "eng", "tsv"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout
    except Exception:
        return None


def _extract_line_boxes(tsv_text: str):
    lines = []
    if not tsv_text:
        return lines
    reader = csv.DictReader(tsv_text.splitlines(), delimiter='\t')
    grouped = {}
    for row in reader:
        try:
            if row.get("level") != "5":
                continue
            text = row.get("text", "").strip()
            if not text:
                continue
            key = (row.get("block_num"), row.get("par_num"), row.get("line_num"))
            left = int(row.get("left", 0))
            top = int(row.get("top", 0))
            width = int(row.get("width", 0))
            height = int(row.get("height", 0))
            item = grouped.setdefault(key, {"words": [], "left": left, "top": top, "right": left + width, "bottom": top + height})
            item["words"].append(text)
            item["left"] = min(item["left"], left)
            item["top"] = min(item["top"], top)
            item["right"] = max(item["right"], left + width)
            item["bottom"] = max(item["bottom"], top + height)
        except Exception:
            continue

    for item in grouped.values():
        text = " ".join(item["words"]).strip()
        if text:
            lines.append({
                "text": text,
                "bbox": (item["left"], item["top"], item["right"] - item["left"], item["bottom"] - item["top"])
            })
    return lines


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-zA-Z0-9 ]+", " ", text.lower())).strip()


def _contact_variants(contact: str) -> list[str]:
    base = re.sub(r"\s+", " ", (contact or "").strip())
    if not base:
        return []
    variants = [base]
    parts = [p for p in re.split(r"\s+", base) if p]
    if len(parts) >= 2:
        variants.append(" ".join(parts[:2]))
    if parts:
        variants.append(parts[0])
    dedup = []
    seen = set()
    for v in variants:
        key = v.lower().strip()
        if key and key not in seen:
            seen.add(key)
            dedup.append(v)
    return dedup


def _clean_ocr_label(text: str) -> str:
    import re
    # Remove common timestamps, dates, and days of the week
    text = re.sub(r'\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?\b', '', text)
    text = re.sub(r'\b\d{1,2}/\d{1,2}/\d{2,4}\b', '', text)
    text = re.sub(r'\b(?:Yesterday|Today|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b', '', text, flags=re.IGNORECASE)
    # Remove stray unread notification numbers at the end
    text = re.sub(r'\s+\d+\s*$', '', text)
    text = re.sub(r'[{}|©@®$*<>~]', '', text)
    return re.sub(r'\s+', ' ', text).strip()

def draw_debug_boxes(image_path: str, candidates: list) -> str:
    try:
        from PIL import Image, ImageDraw
        img = Image.open(image_path)
        draw = ImageDraw.Draw(img)
        for i, c in enumerate(candidates):
            x, y, w, h = c["bbox"]
            label = c.get("text") or c.get("label", "")
            draw.rectangle([x, y, x+w, y+h], outline="red", width=3)
            # draw index slightly above box
            draw.text((max(0, x), max(0, y-15)), f"{i+1}. {label}", fill="red")
        out_path = image_path.replace(".png", "-debug.png")
        img.save(out_path)
        return out_path
    except Exception:
        return image_path

def _best_label(labels, target_tokens):
    best = None
    best_score = (-1, 0)
    for label in labels:
        norm = _normalize(label)
        if not norm:
            continue
        match_count = sum(1 for t in target_tokens if t in norm)
        clean = _clean_ocr_label(label)
        score = (match_count, -len(clean))
        if score > best_score:
            best_score = score
            best = clean
    return best or _clean_ocr_label(labels[0] if labels else "")


def _match_candidates(lines, target: str, limit: int):
    target_norm = _normalize(target)
    if not target_norm:
        return [], 0
    target_tokens = [t for t in target_norm.split() if t]
    matches = []
    for line in lines:
        text_norm = _normalize(line["text"])
        if not text_norm:
            continue
        if all(t in text_norm for t in target_tokens):
            matches.append(line)
    if not matches:
        return [], 0

    # Group matches into row buckets by Y position to avoid duplicate lines per row
    rows = []
    for line in matches:
        lx, ly, lw, lh = line["bbox"]
        placed = False
        for row in rows:
            # Merging threshold must be strict to prevent pulling in the message preview text from the contact above it
            if abs(ly - row["y"]) <= max(4, int(lh * 0.4)):
                row["left"] = min(row["left"], lx)
                row["top"] = min(row["top"], ly)
                row["right"] = max(row["right"], lx + lw)
                row["bottom"] = max(row["bottom"], ly + lh)
                # Recalculate row's central Y slightly to maintain a rolling average for the line
                row["y"] = (row["y"] + ly) // 2
                row["labels"].append(line["text"])
                placed = True
                break
        if not placed:
            rows.append({
                "y": ly,
                "left": lx,
                "top": ly,
                "right": lx + lw,
                "bottom": ly + lh,
                "labels": [line["text"]],
            })

    rows.sort(key=lambda r: r["y"])
    total = len(rows)
    # Default to returning max 5 cleaned candidates to avoid overwhelming the user
    limit = min(limit, 5)
    limited = rows[:limit]
    candidates = []
    for row in limited:
        label = _best_label(row["labels"], target_tokens)
        if len(label) < 2:
            continue
        candidates.append({
            "text": label,
            "bbox": (row["left"], row["top"], row["right"] - row["left"], row["bottom"] - row["top"]),
        })
    return candidates, total

def _candidate_payload_for_image(image_path: str, origin: Tuple[int, int], contact_name: str, app_name: str, source: str):
    tsv = _tesseract_tsv(image_path)
    if tsv:
        lines = _extract_line_boxes(tsv)
        combined = " ".join([l.get("text", "") for l in lines]).lower()
        if "no results" in combined:
            return _payload(
                "needs_attention",
                f"No results for '{contact_name}'. Try a different spelling or scroll.",
                screenshot_path=image_path,
                ocr_text="",
            )
        candidates, total = _match_candidates(lines, contact_name, VLM_MAX_CANDIDATES)
        if candidates:
            image_path = draw_debug_boxes(image_path, candidates)
            cand_payload = [
                {"bbox": c["bbox"], "label": c.get("text", ""), "confidence": 0.7}
                for c in candidates
            ]
            suffix = ""
            if total > len(candidates):
                suffix = f" Showing {len(candidates)} of {total} matches."
            return _payload(
                "select_candidate",
                "Possible matches found. Reply with /pick <id> <number>." + suffix,
                screenshot_path=image_path,
                ocr_text="",
                candidates=cand_payload,
                origin=origin,
                source=source,
            )

    # fallback to VLM if OCR not available or failed
    candidates, raw = locate_candidates(image_path, contact_name, context_hint=f"{app_name} chat list", max_candidates=VLM_MAX_CANDIDATES)
    if candidates:
        image_path = draw_debug_boxes(image_path, candidates)
        cand_payload = [
            {"bbox": c["bbox"], "label": c.get("label", ""), "confidence": c.get("confidence", 0.0)}
            for c in candidates
        ]
        return _payload(
            "select_candidate",
            "Possible matches found. Reply with /pick <id> <number>.",
            screenshot_path=image_path,
            ocr_text=raw,
            candidates=cand_payload,
            origin=origin,
            source=source,
        )

    return _payload(
        "needs_attention",
        "Could not locate contact reliably. Please confirm the correct chat.",
        screenshot_path=image_path,
        ocr_text=raw if 'raw' in locals() else "",
        source=source,
    )


def _ocr_image(path: Optional[str]) -> Optional[str]:
    if not path:
        return None
    if not shutil.which("tesseract"):
        return None
    try:
        result = subprocess.run(
            ["tesseract", path, "stdout", "--psm", "6", "-l", "eng"],
            capture_output=True,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except Exception:
        return None


def _verify_header_contact(app_name: str, contact: str) -> Tuple[bool, Optional[str], Optional[str]]:
    header = _capture_header_region(app_name)
    if not header:
        return False, None, None
    path, _, _, _, _ = header
    ocr_text = _ocr_image(path) or ""
    if ocr_text:
        ocr_norm = _normalize(ocr_text)
        contact_tokens = [t for t in _normalize(contact).split() if len(t) >= 2]
        matched = bool(contact_tokens) and all(t in ocr_norm for t in contact_tokens)
    else:
        matched = False
    return matched, path, ocr_text


def _ocr_text_is_usable(text: Optional[str]) -> bool:
    if not text:
        return False
    compact = re.sub(r"\s+", "", text)
    if len(compact) < 4:
        return False
    alpha = sum(1 for ch in compact if ch.isalpha())
    ratio = alpha / max(1, len(compact))
    return ratio >= 0.5


def _focus_message_input_accessibility(app_name: str) -> bool:
    script = f'''
    tell application "System Events" to tell process "{app_name}"
        if not (exists window 1) then return "NO_WINDOW"
        try
            set theArea to text area 1 of window 1
            perform action "AXPress" of theArea
            set focused of theArea to true
            return "OK"
        end try
        try
            set theField to text field 1 of window 1
            perform action "AXPress" of theField
            set focused of theField to true
            return "OK"
        end try
        return "NOT_FOUND"
    end tell
    '''
    out = _execute_applescript(script)
    return out.strip() == "OK"


def _send_slack_message(contact: str, message: str, force_send: bool = False, assume_chat_open: bool = False) -> str:
    if not _ensure_app_ready("Slack"):
        return _payload("error", "Slack is not ready. Please open it once and try again.")

    if assume_chat_open:
        if not force_send:
            matched, header_path, ocr_text = _verify_header_contact("Slack", contact)
            if not matched:
                shot = header_path or _capture_fullscreen()
                return _payload(
                    "needs_attention",
                    "Channel/contact header does not match target. Please open the correct chat and try again.",
                    screenshot_path=shot,
                    ocr_text=ocr_text,
                )
        if _should_use_cursor_fallback():
            err = _click_message_box("Slack")
            if err:
                return _payload("needs_attention", err, screenshot_path=_capture_fullscreen())
            err = _type_message_pyautogui(message)
            if err:
                return _payload("needs_attention", err, screenshot_path=_capture_fullscreen())
        else:
            focused = _focus_message_input_accessibility("Slack")
            if not focused:
                return _payload("needs_attention", "Could not focus message input. Please click the message box and retry.")
            message_escaped = _escape_applescript(message)
            type_script = f'''
            tell application "System Events"
                keystroke "{message_escaped}"
                delay 0.2
                key code 36
            end tell
            '''
            res3 = _execute_applescript(type_script)
            if "Error" in res3:
                return _payload("error", res3, screenshot_path=_capture_window("Slack"))
        return _payload(
            "ok",
            f"Attempted to send message to {contact} on Slack. Please confirm in app.",
            screenshot_path=_capture_window("Slack") or _capture_fullscreen(),
            used_cursor_fallback=_should_use_cursor_fallback(),
        )

    contact_escaped = _escape_applescript(contact)
    script = f'''
    tell application "Slack" to activate
    delay 0.6
    tell application "System Events"
        -- Press Cmd+K to jump
        keystroke "k" using {{command down}}
        delay 0.5

        -- Clear any existing text
        keystroke "a" using {{command down}}
        key code 51
        delay 0.2

        -- Type the contact name
        keystroke "{contact_escaped}"
        delay 1.2
    end tell
    '''
    res = _execute_applescript(script)
    if "Error" in res and _should_use_cursor_fallback():
        return _send_slack_message_pyautogui(contact, message)
    if "Error" in res:
        return _payload("error", res)

    clicked_contact = False
    if not force_send:
        payload = get_candidate_payload("Slack", contact)
        parsed = json.loads(payload)
        if parsed.get("status") == "select_candidate":
            candidates = parsed.get("candidates", [])
            if len(candidates) > 1:
                return payload
        elif parsed.get("status") != "ok":
            return payload

    if not clicked_contact:
        open_script = '''
        tell application "System Events"
            key code 125
            key code 36
            delay 0.8
        end tell
        '''
        res2 = _execute_applescript(open_script)
    else:
        time.sleep(0.5)
        res2 = ""

    if "Error" in res2 and _should_use_cursor_fallback():
        return _send_slack_message_pyautogui(contact, message)
    if "Error" in res2:
        return _payload("error", res2, screenshot_path=_capture_window("Slack"))

    if not force_send and not clicked_contact:
        matched, header_path, ocr_text = _verify_header_contact("Slack", contact)
        if not matched:
            shot = header_path or _capture_fullscreen()
            return _payload(
                "needs_attention",
                "Channel/contact header does not match target. Please confirm the correct chat.",
                screenshot_path=shot,
                ocr_text=ocr_text,
            )

    used_cursor = False
    if _should_use_cursor_fallback():
        err = _click_message_box("Slack")
        if err:
            return _payload("needs_attention", err, screenshot_path=_capture_fullscreen())
        err = _type_message_pyautogui(message)
        if err:
            return _payload("needs_attention", err, screenshot_path=_capture_fullscreen())
        used_cursor = True
    else:
        focused = _focus_message_input_accessibility("Slack")
        if not focused:
            return _payload("needs_attention", "Could not focus message input. Please click the message box and retry.")
        message_escaped = _escape_applescript(message)
        type_script = f'''
        tell application "System Events"
            keystroke "{message_escaped}"
            delay 0.2
            key code 36
        end tell
        '''
        res3 = _execute_applescript(type_script)
        if "Error" in res3:
            return _payload("error", res3, screenshot_path=_capture_window("Slack"))

    return _payload(
        "ok",
        f"Attempted to send message to {contact} on Slack. Please confirm in app.",
        screenshot_path=_capture_window("Slack") or _capture_fullscreen(),
        used_cursor_fallback=used_cursor,
    )


def _send_imessage(contact: str, message: str, force_send: bool = False, assume_chat_open: bool = False) -> str:
    if not _ensure_app_ready("Messages"):
        return _payload("error", "Messages is not ready. Please open it once and try again.")

    if assume_chat_open:
        if not force_send:
            matched, header_path, ocr_text = _verify_header_contact("Messages", contact)
            if not matched:
                shot = header_path or _capture_fullscreen()
                return _payload(
                    "needs_attention",
                    "Header does not match target. Please open the correct chat and try again.",
                    screenshot_path=shot,
                    ocr_text=ocr_text,
                )
        if _should_use_cursor_fallback():
            err = _click_message_box("Messages")
            if err:
                return _payload("needs_attention", err, screenshot_path=_capture_fullscreen())
            err = _type_message_pyautogui(message)
            if err:
                return _payload("needs_attention", err, screenshot_path=_capture_fullscreen())
        else:
            focused = _focus_message_input_accessibility("Messages")
            if not focused:
                return _payload("needs_attention", "Could not focus message input. Please click the message box and retry.")
            message_escaped = _escape_applescript(message)
            type_script = f'''
            tell application "System Events"
                keystroke "{message_escaped}"
                delay 0.2
                key code 36
            end tell
            '''
            res2 = _execute_applescript(type_script)
            if "Error" in res2:
                return _payload("error", res2, screenshot_path=_capture_window("Messages"))
        return _payload(
            "ok",
            f"Attempted to send message to {contact} on iMessage. Please confirm in app.",
            screenshot_path=_capture_window("Messages") or _capture_fullscreen(),
        )

    contact_escaped = _escape_applescript(contact)
    message_escaped = _escape_applescript(message)
    script = f'''
    tell application "Messages"
        activate
        set targetBuddy to buddy "{contact_escaped}" of service "E:iMessage"
        -- Fallback if not an iMessage buddy, try SMS or just normal sending
        -- For simplicity, just GUI scripting like the others if dictionary fails, but let's try raw GUI:
    end tell
    tell application "System Events"
        keystroke "n" using {{command down}}
        delay 0.5
        keystroke "{contact_escaped}"
        delay 0.5
        key code 36
        delay 0.5
    end tell
    '''
    res = _execute_applescript(script)
    if "Error" in res and _should_use_cursor_fallback():
        return _send_imessage_pyautogui(contact, message)
    if "Error" in res:
        return _payload("error", res)

    if not force_send:
        matched, header_path, ocr_text = _verify_header_contact("Messages", contact)
        if not matched:
            shot = header_path or _capture_fullscreen()
            return _payload(
                "needs_attention",
                "Header does not match target. Please confirm the correct chat.",
                screenshot_path=shot,
                ocr_text=ocr_text,
            )

    if _should_use_cursor_fallback():
        err = _click_message_box("Messages")
        if err:
            return _payload("needs_attention", err, screenshot_path=_capture_fullscreen())
        err = _type_message_pyautogui(message)
        if err:
            return _payload("needs_attention", err, screenshot_path=_capture_fullscreen())
    else:
        focused = _focus_message_input_accessibility("Messages")
        if not focused:
            return _payload("needs_attention", "Could not focus message input. Please click the message box and retry.")
        type_script = f'''
        tell application "System Events"
            keystroke "{message_escaped}"
            delay 0.2
            key code 36
        end tell
        '''
        res2 = _execute_applescript(type_script)
        if "Error" in res2:
            return _payload("error", res2, screenshot_path=_capture_window("Messages"))

    return _payload(
        "ok",
        f"Attempted to send message to {contact} on iMessage. Please confirm in app.",
        screenshot_path=_capture_window("Messages") or _capture_fullscreen(),
    )


def _click_message_box(app_name: str) -> Optional[str]:
    try:
        import pyautogui
    except Exception as exc:
        return f"Cursor fallback requires pyautogui: {exc}"

    bounds = _get_window_bounds(app_name)
    if bounds:
        x, y, w, h = bounds
        click_x = x + int(w * 0.6)
        click_y = y + h - 60
        pyautogui.click(click_x, click_y)
        time.sleep(0.2)
        return None

    full = _capture_fullscreen()
    if full:
        bbox, confidence, raw = locate_ui_element_bbox(full, "message input box")
        if bbox and confidence >= VLM_CONFIDENCE_THRESHOLD:
            bx, by, bw, bh = bbox
            pyautogui.click(bx + max(1, bw // 2), by + max(1, bh // 2))
            time.sleep(0.2)
            return None

    return "Unable to read window bounds for cursor fallback. Ensure Accessibility + Screen Recording permissions and that the app window is visible."


def _click_at(x: int, y: int) -> Optional[str]:
    script = f'''
    tell application "System Events"
        click at {{{x}, {y}}}
        delay 0.1
        click at {{{x}, {y}}}
    end tell
    '''
    res = _execute_applescript(script)
    if "Error" in res:
        return f"AppleScript click failed: {res}"
    time.sleep(0.3)
    _execute_applescript('tell application "System Events" to key code 36')
    time.sleep(0.5)
    return None


def _type_message_pyautogui(message: str) -> Optional[str]:
    try:
        import pyautogui
    except Exception as exc:
        return f"Cursor fallback requires pyautogui: {exc}"

    pyautogui.typewrite(message)
    time.sleep(0.2)
    pyautogui.press("enter")
    return None


def _send_slack_message_pyautogui(contact: str, message: str) -> str:
    try:
        import pyautogui
    except Exception as exc:
        return _payload("error", f"Fallback requires pyautogui: {exc}")

    subprocess.run(["open", "-a", "Slack"], check=False)
    if not _wait_for_window("Slack"):
        return _payload("error", "Slack is not ready. Please open it once and try again.")
    time.sleep(0.4)
    pyautogui.hotkey("command", "k")
    time.sleep(0.4)
    pyautogui.hotkey("command", "a")
    pyautogui.press("backspace")
    time.sleep(0.2)
    pyautogui.typewrite(contact)
    time.sleep(0.8)
    pyautogui.press("down")
    pyautogui.press("enter")
    time.sleep(0.6)
    err = _click_message_box("Slack")
    if err:
        return _payload("error", err, screenshot_path=_capture_fullscreen())
    err = _type_message_pyautogui(message)
    if err:
        return _payload("error", err, screenshot_path=_capture_fullscreen())
    return _payload(
        "ok",
        f"Attempted to send message to {contact} on Slack (cursor fallback used).",
        screenshot_path=_capture_window("Slack") or _capture_fullscreen(),
        used_cursor_fallback=True,
    )


def _send_imessage_pyautogui(contact: str, message: str) -> str:
    try:
        import pyautogui
    except Exception as exc:
        return _payload("error", f"Fallback requires pyautogui: {exc}")

    subprocess.run(["open", "-a", "Messages"], check=False)
    if not _wait_for_window("Messages"):
        return _payload("error", "Messages is not ready. Please open it once and try again.")
    time.sleep(0.4)
    pyautogui.hotkey("command", "n")
    time.sleep(0.4)
    pyautogui.typewrite(contact)
    time.sleep(0.4)
    pyautogui.press("enter")
    time.sleep(0.4)
    err = _click_message_box("Messages")
    if err:
        return _payload("error", err, screenshot_path=_capture_fullscreen())
    err = _type_message_pyautogui(message)
    if err:
        return _payload("error", err, screenshot_path=_capture_fullscreen())
    return _payload(
        "ok",
        f"Attempted to send message to {contact} on iMessage (cursor fallback used).",
        screenshot_path=_capture_window("Messages") or _capture_fullscreen(),
        used_cursor_fallback=True,
    )


TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "send_message_macos",
            "description": "Send a message to a contact via desktop apps like WhatsApp, Slack, or iMessage on macOS.",
            "parameters": {
                "type": "object",
                "properties": {
                    "app_name": {
                        "type": "string",
                        "description": "The name of the application to use (e.g., 'WhatsApp', 'Slack', 'iMessage')."
                    },
                    "contact_name": {
                        "type": "string",
                        "description": "The name of the contact to message."
                    },
                    "message": {
                        "type": "string",
                        "description": "The exact body of the text message to send. CRITICAL: DO NOT include the user's intent or command action verbs. Example Correct: 'I love you'. Example Incorrect: 'Say I love you to her'."
                    },
                    "force_send": {
                        "type": "boolean",
                        "description": "Skip contact verification and send to the first matched chat."
                    },
                    "assume_chat_open": {
                        "type": "boolean",
                        "description": "Assume the correct chat is already open and only send the message."
                    },
                    "confirm_contact_only": {
                        "type": "boolean",
                        "description": "Open and select contact, then return screenshot for confirmation without sending."
                    }
                },
                "required": ["app_name", "contact_name", "message"]
            }
        }
    }
]

AVAILABLE_TOOLS = {
    "send_message_macos": send_message_macos
}
