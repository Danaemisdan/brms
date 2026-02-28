import re

path = '/Users/sanjeevn/Downloads/Agent/LocalManager/src/tools/macos_ui.py'
with open(path, 'r') as f:
    text = f.read()

# Target the second (old) implementation of _send_whatsapp_message which starts around line 624
# and ends right before _send_slack_message around line 782
start_sig = "def _send_whatsapp_message("
end_sig = "def _send_slack_message("

occurrences = []
idx = 0
while True:
    idx = text.find("def _send_whatsapp_message(", idx)
    if idx == -1: break
    occurrences.append(idx)
    idx += 1

if len(occurrences) > 1:
    # the first one is the new Chrome one (inserted earlier), the second one is the old one.
    start_cut = occurrences[1]
    end_cut = text.find(end_sig, start_cut)
    
    if end_cut != -1:
        new_text = text[:start_cut] + text[end_cut:]
        with open(path, 'w') as f:
            f.write(new_text)
        print("Successfully removed the old second definition.")
    else:
        print("Could not find end signature for the old definition.")
else:
    print("Only one definition found.")

# Also remove the other whatsapp specific applescript helpers that are no longer used by chrome logic
removals = [
    ("def _is_whatsapp_home_screen(", "def _select_whatsapp_contact("),
    ("def _select_whatsapp_contact(", "def _read_whatsapp_search_value("),
    ("def _read_whatsapp_search_value(", "def _focus_message_input_accessibility(")
]

with open(path, 'r') as f:
    text = f.read()

for start_tag, end_tag in removals:
    s_idx = text.find(start_tag)
    e_idx = text.find(end_tag)
    if s_idx != -1 and e_idx != -1 and s_idx < e_idx:
        text = text[:s_idx] + text[e_idx:]

# And the fallback ones at the bottom:
s_idx2 = text.find("def _send_whatsapp_message_pyautogui(")
e_idx2 = text.find("def _send_slack_message_pyautogui(")
if s_idx2 != -1 and e_idx2 != -1 and s_idx2 < e_idx2:
    text = text[:s_idx2] + text[e_idx2:]

with open(path, 'w') as f:
    f.write(text)
    
print("Cleaned up old helpers.")
