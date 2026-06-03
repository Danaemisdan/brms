import os
import time
import logging
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

class WhatsAppAgent:
    def __init__(self):
        self.p = sync_playwright().start()
        profile_dir = os.getenv(
            "WHATSAPP_CHROME_PROFILE_DIR",
            os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../chrome_data_whatsapp")),
        )
        os.makedirs(profile_dir, exist_ok=True)
        logging.info(f"Launching persistent standby WhatsApp Agent at {profile_dir}...")
        self.context = self.p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=False,
            channel="chrome",
            viewport={'width': 1280, 'height': 800},
            args=['--disable-blink-features=AutomationControlled']
        )
        self.page = self.context.pages[0] if len(self.context.pages) > 0 else self.context.new_page()
        
        logging.info("Navigating to WhatsApp Web and waiting for standby...")
        self.page.goto("https://web.whatsapp.com")
        try:
            self.page.locator("#side").first.wait_for(state="attached", timeout=120000)
            logging.info("WhatsApp Agent is now ONLINE and STANDBY.")
        except Exception as e:
            logging.error(f"WhatsApp did not load or QR not scanned in time: {e}")

    def send_batch(self, contacts: list[str], message: str, attachment_path: str = None) -> list[dict]:
        results = []
        try:
            # Ensure we are on the main page
            if "web.whatsapp.com" not in self.page.url:
                self.page.goto("https://web.whatsapp.com")
                
            main_ui = self.page.locator("#side").first
            main_ui.wait_for(state="attached", timeout=30000)
            
            for index, contact in enumerate(contacts):
                logging.info(f"[{index + 1}/{len(contacts)}] Processing contact/group: {contact}")
                is_phone_number = all(c.isdigit() or c in "+-() " for c in contact)
                
                try:
                    if is_phone_number:
                        logging.info(f"Opening chat with {contact} directly via URL...")
                        self.page.goto(f"https://web.whatsapp.com/send?phone={contact}")
                    else:
                        logging.info(f"Searching for group/contact name: {contact}...")
                        try:
                            search_box = self.page.locator("#side div[contenteditable='true']").first
                            search_box.click(timeout=3000)
                        except Exception:
                            try:
                                new_chat_btn = self.page.locator("span[data-icon='new-chat-outline'], button[aria-label='New chat']").first
                                new_chat_btn.click(timeout=3000)
                            except Exception:
                                self.page.keyboard.press("Meta+Control+/")
                                self.page.keyboard.press("Control+Alt+/")
                        
                        time.sleep(1)
                        self.page.keyboard.press("Control+A")
                        self.page.keyboard.press("Backspace")
                        self.page.keyboard.type(contact, delay=50)
                        time.sleep(2)
                        self.page.keyboard.press("Enter")
                        time.sleep(2)
                    
                    chat_box = self.page.locator("div[contenteditable='true'][role='textbox']").last
                    chat_box.wait_for(state="attached", timeout=30000)
                    time.sleep(2)
                    
                    if attachment_path and os.path.exists(attachment_path):
                        logging.info(f"Attaching file: {attachment_path}")
                        try:
                            attach_btn = self.page.locator("button[aria-label='Attach'], span[data-icon='plus']").first
                            attach_btn.click(timeout=5000)
                            time.sleep(1)
                            with self.page.expect_file_chooser(timeout=10000) as fc_info:
                                self.page.locator("text=Photos & videos").last.click()
                            fc_info.value.set_files(attachment_path)
                            logging.info("Selected file via 'Photos & videos' menu successfully!")
                        except Exception as e:
                            logging.error(f"Failed to use native attachment menu: {e}")
                            
                        time.sleep(3)
                        logging.info("Typing message as caption...")
                        self.page.keyboard.insert_text(message)
                        time.sleep(1)
                        self.page.keyboard.press("Enter")
                        time.sleep(1)
                        try:
                            send_btn = self.page.locator("span[data-icon='send'], button[aria-label='Send']").first
                            if send_btn.is_visible(timeout=2000):
                                send_btn.click(force=True)
                        except Exception:
                            pass
                    else:
                        logging.info("Typing message...")
                        chat_box.click(force=True, timeout=5000)
                        self.page.keyboard.insert_text(message)
                        time.sleep(1)
                        self.page.keyboard.press("Enter")
                        time.sleep(1)
                        try:
                            send_btn = self.page.locator("span[data-icon='send'], button[aria-label='Send']").first
                            if send_btn.is_visible(timeout=2000):
                                send_btn.click(force=True)
                        except Exception:
                            pass
                    
                    logging.info(f"Message sent successfully to {contact}!")
                    time.sleep(2)
                    results.append({"contact": contact, "status": "success", "message": f"Sent message to {contact} via Playwright"})
                
                except Exception as loop_e:
                    logging.error(f"Failed to send to {contact}: {loop_e}")
                    results.append({"contact": contact, "status": "error", "message": str(loop_e)})
                    self.page.goto("https://web.whatsapp.com")
                    main_ui.wait_for(state="attached", timeout=60000)
            
            # Go back to main screen after batch completes to stay clean
            self.page.goto("https://web.whatsapp.com")
            return results
            
        except Exception as e:
            logging.error(f"Playwright WhatsApp critical error: {e}")
            return [{"contact": c, "status": "error", "message": str(e)} for c in contacts]

    def close(self):
        try:
            self.context.close()
            self.p.stop()
        except Exception:
            pass

