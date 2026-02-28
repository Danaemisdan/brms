import os
import time
import logging
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

def send_whatsapp_message_playwright(contact: str, message: str) -> dict:
    """
    Sends a WhatsApp message using a persistent stealth Chrome profile.
    Waits for the user to scan the QR code if logging in for the first time.
    """
    profile_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../chrome_data"))
    
    with sync_playwright() as p:
        # Launch persistent context
        logging.info(f"Launching Stealth Chrome at {profile_dir}")
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=False, # Keep visible for QR scan and WhatsApp stability
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
            # We use a long timeout in case the user needs to scan the QR code
            search_box = page.locator("div[contenteditable='true'][data-tab='3'], div[title='Search input textbox']").first
            search_box.wait_for(timeout=120000) # 2 minutes to scan a QR if not logged in
            
            logging.info(f"Searching for contact/group: {contact}")
            search_box.click()
            
            # Clear existing search if any
            page.keyboard.press("Control+A")
            page.keyboard.press("Backspace")
            
            page.keyboard.type(contact, delay=50)
            time.sleep(2)
            
            # Select the contact
            page.keyboard.press("Enter")
            time.sleep(2)
            
            # Locate the chat input box
            logging.info("Locating chat input...")
            chat_box = page.locator("div[contenteditable='true'][data-tab='10'], div[title='Type a message']").first
            chat_box.wait_for(timeout=10000)
            chat_box.click()
            
            logging.info("Typing message...")
            page.keyboard.insert_text(message)
            time.sleep(1)
            page.keyboard.press("Enter")
            
            logging.info(f"Message sent successfully to {contact}!")
            time.sleep(3) # A brief wait for the message to propagate over network
            
            return {"status": "success", "message": f"Sent message to {contact} via Playwright"}
            
        except Exception as e:
            logging.error(f"Playwright WhatsApp error: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            context.close()
