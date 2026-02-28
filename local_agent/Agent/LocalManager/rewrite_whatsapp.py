import re

path = '/Users/sanjeevn/Downloads/Agent/LocalManager/src/tools/macos_ui.py'
with open(path, 'r') as f:
    text = f.read()

# We need to completely remove the existing _send_whatsapp_message and replace it 
# with the Chrome Web version.
start_idx = text.find("def _send_whatsapp_message(")
if start_idx == -1:
    print("Could not find start index")
    exit(1)

end_idx = text.find("def _send_slack_message(", start_idx)
if end_idx == -1:
    print("Could not find end index")
    exit(1)

new_whatsapp_logic = """def _send_whatsapp_message(
    contact: str,
    message: str,
    force_send: bool = False,
    assume_chat_open: bool = False,
    confirm_contact_only: bool = False,
) -> str:
    import re
    is_phone = bool(re.match(r'^\\+?\\d+$', re.sub(r'[\\s\\-\\(\\)]', '', contact)))

    _execute_applescript('tell application "Google Chrome" to activate')

    def switch_to_whatsapp():
        url = _execute_chrome_js('window.location.href;')
        if "web.whatsapp.com" not in url:
            _execute_applescript('''
            tell application "Google Chrome"
                set the active tab of window 1 to (make new tab at window 1 with properties {URL:"https://web.whatsapp.com/"})
            end tell
            ''')
        for _ in range(30):
            res = _execute_chrome_js('''
            (function() {
                if (document.querySelector('div[contenteditable="true"][data-tab="3"]') || 
                    document.querySelector('div[title="Search input textbox"]') ||
                    document.querySelector('canvas')) {
                    return "READY";
                }
                return "WAIT";
            })();
            ''')
            if res == "READY":
                return True
            time.sleep(1)
        return False

    def verify_and_get():
        res = _execute_chrome_js('''
        (function() {
            var header = document.querySelector('header span[title]');
            var headerText = header ? header.getAttribute('title') : "";
            var msgs = document.querySelectorAll('.message-out .copyable-text');
            var lastMsgText = "";
            if (msgs.length > 0) {
                var lastMsg = msgs[msgs.length - 1];
                var span = lastMsg.querySelector('span.selectable-text');
                if (span) {
                    lastMsgText = span.innerText;
                }
            }
            return JSON.stringify({header: headerText, last_msg: lastMsgText});
        })();
        ''')
        try:
            import json
            return json.loads(res)
        except:
            return {"header": "", "last_msg": ""}

    if is_phone:
        phone_num = re.sub(r'[^\\d\\+]', '', contact)
        escaped_msg = message.replace('\\\\', '\\\\\\\\').replace('"', '\\\\"').replace("'", "\\\\'")
        url_dest = f"https://web.whatsapp.com/send?phone={phone_num}&text={escaped_msg}"
        
        _execute_applescript(f'''
        tell application "Google Chrome"
            set the active tab of window 1 to (make new tab at window 1 with properties {{URL:"{url_dest}"}})
        end tell
        ''')
        
        ready = False
        for _ in range(30):
            res = _execute_chrome_js('''
            (function() {
                var btn = document.querySelector('span[data-icon="send"]');
                if (btn) return "READY";
                var invalid = document.querySelector('div[data-animate-modal-popup="true"]');
                if (invalid && invalid.innerText.includes("invalid")) return "INVALID";
                return "WAIT";
            })();
            ''')
            if res == "READY":
                ready = True
                break
            if res == "INVALID":
                return _payload("error", f"WhatsApp considers {phone_num} invalid.")
            time.sleep(1)
            
        if not ready:
            return _payload("error", "Timeout waiting for WhatsApp chat to load.")
            
        if confirm_contact_only:
             return _payload("confirm_contact", f"Match found for {contact}. Send?", screenshot_path=_capture_fullscreen())

        _execute_chrome_js('''
        (function() {
            var btn = document.querySelector('span[data-icon="send"]');
            if (btn) btn.closest('button').click();
        })();
        ''')
        time.sleep(1)
        
    else:
        if not switch_to_whatsapp():
            return _payload("error", "Timeout waiting for WhatsApp Web to load.")
            
        contact_esc = contact.replace('\\\\', '\\\\\\\\').replace('"', '\\\\"').replace("'", "\\\\'")
        res = _execute_chrome_js(f'''
        (function() {{
            var search = document.querySelector('div[contenteditable="true"][data-tab="3"]') ||
                         document.querySelector('div[title="Search input textbox"]') ||
                         document.querySelector('p.selectable-text');
            if (!search) {{
                var cc = document.querySelectorAll('div[contenteditable="true"]');
                if (cc.length > 0) search = cc[0];
            }}
            if (!search) return "NO_SEARCH";
            search.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, "{contact_esc}");
            return "TYPED";
        }})();
        ''')
        if res == "NO_SEARCH":
            return _payload("error", "Could not find WhatsApp search box.")
            
        time.sleep(2)
        
        res = _execute_chrome_js(f'''
        (function() {{
            var list = document.querySelectorAll('#pane-side div[role="listitem"]');
            if (list.length === 0) return "NOT_FOUND";
            
            var target = "{contact_esc}".toLowerCase();
            for (var i=0; i<list.length; i++) {{
                var titleElem = list[i].querySelector('span[title]');
                if (titleElem && titleElem.getAttribute('title').toLowerCase().includes(target)) {{
                    var clickTarget = list[i].querySelector('div[role="button"]') || list[i];
                    clickTarget.click();
                    return "CLICKED_MATCH";
                }}
            }}
            var clickTarget = list[0].querySelector('div[role="button"]') || list[0];
            clickTarget.click();
            return "CLICKED_FIRST";
        }})();
        ''')
        if res == "NOT_FOUND":
            return _payload("error", f"No contact found matching '{contact}'.")
            
        time.sleep(1)
        
        if confirm_contact_only:
             return _payload("confirm_contact", f"Match found for {contact}. Send?", screenshot_path=_capture_fullscreen())

        if not force_send and AUTO_CONTACT_CONFIRM:
            v_data = verify_and_get()
            header = _normalize(v_data.get("header", ""))
            c_norm = _normalize(contact)
            if c_norm not in header and not all(t in header for t in c_norm.split()):
                return _payload("needs_attention", f"Header '{header}' does not match '{contact}'.", screenshot_path=_capture_fullscreen())

        msg_esc = message.replace('\\\\', '\\\\\\\\').replace('"', '\\\\"').replace("'", "\\\\'")
        _execute_chrome_js(f'''
        (function() {{
            var compose = document.querySelector('div[contenteditable="true"][data-tab="10"]') ||
                          document.querySelectorAll('div[contenteditable="true"]')[1];
            if (!compose) return "NO_COMPOSE";
            compose.focus();
            document.execCommand('selectAll', false, null);
            document.execCommand('insertText', false, "{msg_esc}");
        }})();
        ''')
        time.sleep(0.5)
        _execute_chrome_js('''
        (function() {
            var btn = document.querySelector('span[data-icon="send"]');
            if (btn) btn.closest('button').click();
        })();
        ''')
        time.sleep(1)

    target_msg_norm = _normalize(message)
    verified = False
    for _ in range(5):
        v_data = verify_and_get()
        last_msg = _normalize(v_data.get("last_msg", ""))
        if target_msg_norm in last_msg or last_msg in target_msg_norm:
            verified = True
            break
        time.sleep(1)
        
    if not verified:
        return _payload("error", f"Verification failed: Last message did not match '{message}'.", screenshot_path=_capture_fullscreen())

    return _payload("ok", f"Message to {contact} confirmed sent via WhatsApp Web.", screenshot_path=_capture_fullscreen())

"""

text = text[:start_idx] + new_whatsapp_logic + text[end_idx:]

with open(path, 'w') as f:
    f.write(text)

print("Replaced _send_whatsapp_message.")
