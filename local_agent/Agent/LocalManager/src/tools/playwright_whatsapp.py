import os
import time
import logging
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

def send_whatsapp_message_batch_playwright(contacts: list[str], message: str, attachment_path: str = None) -> list[dict]:
    """
    Sends a WhatsApp message to a list of contacts using a single persistent stealth Chrome profile.
    Waits for the user to scan the QR code if logging in for the first time.
    """
    profile_dir = os.getenv(
        "WHATSAPP_CHROME_PROFILE_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../chrome_data_whatsapp")),
    )
    os.makedirs(profile_dir, exist_ok=True)
    
    results = []
    
    with sync_playwright() as p:
        # Launch persistent context
        logging.info(f"Launching Stealth Chrome at {profile_dir} for {len(contacts)} contacts")
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=False, # Keep visible for QR scan and WhatsApp stability
            channel="chrome",
            viewport={'width': 1280, 'height': 800},
            args=['--disable-blink-features=AutomationControlled']
        )
        
        # WhatsApp usually opens a default page in persistent context, let's just use the first one
        page = context.pages[0] if len(context.pages) > 0 else context.new_page()
        Stealth().apply_stealth_sync(page)
        
        try:
            logging.info("Navigating to WhatsApp Web...")
            page.goto("https://web.whatsapp.com")
            
            # Wait for either the search box (logged in) or the QR code
            logging.info("Waiting for WhatsApp to load (scan QR if prompted)...")
            search_box = page.locator("div[contenteditable='true'][data-tab='3'], div[title='Search input textbox']").first
            search_box.wait_for(timeout=120000) # 2 minutes to scan a QR if not logged in
            
            for index, contact in enumerate(contacts):
                logging.info(f"[{index + 1}/{len(contacts)}] Processing contact/group: {contact}")
                try:
                    search_box.click()
                    
                    # Clear existing search if any
                    page.keyboard.press("Control+A")
                    page.keyboard.press("Backspace")
                    
                    page.keyboard.type(contact, delay=50)
                    time.sleep(2)
                    
                    # Select the contact
                    page.keyboard.press("Enter")
                    time.sleep(2)
                    
                    if attachment_path and os.path.exists(attachment_path):
                        logging.info(f"Attaching file: {attachment_path}")
                        
                        # Now try clicking the exact aria-label='Attach' button found in the DOM dump
                        try:
                            attach_btn = page.locator("button[aria-label='Attach']").first
                            attach_btn.click(timeout=5000)
                            time.sleep(1)
                        except Exception as e:
                            logging.warning(f"Attach menu click failed: {e}")
                            
                        try:
                            file_input = page.locator("input[type='file']").first
                            file_input.set_input_files(attachment_path)
                            logging.info("Set input files successfully!")
                        except Exception as e:
                            logging.error(f"Failed to set input files: {e}")
                            
                    # Wait for image preview to load, allowing the caption box to render
                    if attachment_path and os.path.exists(attachment_path):
                        time.sleep(3)
                        
                    logging.info("Typing message...")
                    
                    # Instead of relying on `.last` or `.first`, find the actively available text box.
                    # On attachment screen: usually multiple contenteditables, the active one is for caption.
                    # On normal screen: usually one for search, one for chat.
                    text_boxes = page.locator("div[contenteditable='true'][role='textbox']")
                    text_boxes.wait_for(timeout=10000)
                    
                    # Iterate backwards to find the chat/caption box (it's always after search at the bottom of the DOM)
                    box_count = text_boxes.count()
                    target_box = None
                    for i in range(box_count - 1, -1, -1):
                        box = text_boxes.nth(i)
                        if box.is_visible():
                            target_box = box
                            break
                    
                    if not target_box:
                        logging.warning("Could not find a visible text box. Attempting fallback click on document center.")
                        page.mouse.click(640, 700) # Generic click in the chat area
                        page.keyboard.insert_text(message)
                    else:
                        try:
                            # Use force=True because WhatsApp's translucent overlay sometimes intercepts clicks
                            target_box.click(force=True, timeout=5000)
                            page.keyboard.insert_text(message)
                        except Exception as e:
                            logging.warning(f"Normal click failed, forcing focus: {e}")
                            target_box.focus()
                            page.keyboard.insert_text(message)

                    time.sleep(1)
                    # Hit Enter. If that fails (sometimes WhatsApp intercepts it), click the Send button
                    page.keyboard.press("Enter")
                    
                    time.sleep(1)
                    try:
                        send_btn = page.locator("span[data-icon='send'], button[aria-label='Send']").first
                        if send_btn.is_visible(timeout=2000):
                            logging.info("Enter key didn't send. Clicking 'Send' button explicitly.")
                            send_btn.click(force=True)
                    except Exception:
                        pass
                    
                    logging.info(f"Message sent successfully to {contact}!")
                    time.sleep(2) # A brief wait for the message to propagate over network
                    results.append({"contact": contact, "status": "success", "message": f"Sent message to {contact} via Playwright"})
                
                except Exception as loop_e:
                    logging.error(f"Failed to send to {contact}: {loop_e}")
                    results.append({"contact": contact, "status": "error", "message": str(loop_e)})
                    # Refresh page to reset state if a contact fails catastrophically
                    page.reload()
                    search_box.wait_for(timeout=120000)
            
            return results
            
        except Exception as e:
            logging.error(f"Playwright WhatsApp critical error: {e}")
            # If the whole process crashes, assume all remained pending or failed
            return [{"contact": c, "status": "error", "message": str(e)} for c in contacts]
        finally:
            context.close()
