import os
import json
import time
import logging
from src.tools.playwright_whatsapp import send_whatsapp_message_playwright

# The files are dumped into the root local_agent directory by the backend
AGENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))

def process_campaign_jobs():
    while True:
        try:
            if not os.path.exists(AGENT_DIR):
                time.sleep(10)
                continue

            # Find all campaign_*.json files
            for filename in os.listdir(AGENT_DIR):
                if filename.startswith("campaign_") and filename.endswith(".json"):
                    filepath = os.path.join(AGENT_DIR, filename)
                    process_single_campaign(filepath)
            
        except Exception as e:
            logging.error(f"Error checking for campaign jobs: {e}")
        
        # Check every 10 seconds
        time.sleep(10)

def process_single_campaign(filepath: str):
    logging.info(f"Picked up WhatsApp campaign command: {filepath}")
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        command = data.get("command")
        if command != "BLAST_CAMPAIGN":
            logging.warning(f"Unknown command {command} in {filepath}. Deleting.")
            os.remove(filepath)
            return

        message = data.get("message", "")
        # The backend sets target ("all_customers", "verified_customers", "custom")
        # and custom_phones ("comma-separated list")
        target = data.get("target", "all_customers")
        custom_phones = data.get("custom_phones", "")

        targets = []
        if target == "custom":
            # Split by comma and clean up whitespace
            raw_targets = custom_phones.split(",")
            for t in raw_targets:
                t = t.strip()
                if t:
                    targets.append(t)
        else:
            # Here you would typically fetch numbers from a DB or API based on 'all_customers'. 
            # For now, as a placeholder since we don't have direct DB access from local agent,
            # we will just warn user that only 'custom' is supported natively without API fetch.
            logging.error(f"Target '{target}' is not fully implemented in local agent without /api/users endpoint. Ignoring.")
            os.remove(filepath)
            return

        logging.info(f"Target audience parsed: {targets}")

        # Send messages sequentially
        for idx, contact in enumerate(targets):
            logging.info(f"[{idx+1}/{len(targets)}] Sending to: {contact}")
            result_json = send_whatsapp_message_playwright(
                contact=contact,
                message=message
            )
            logging.info(f"Result for {contact}: {result_json}")
            # wait briefly between messages to avoid spam locks
            time.sleep(5)
            
        logging.info(f"Finished processing campaign {filepath}. Deleting file.")
        os.remove(filepath)

    except json.JSONDecodeError:
        logging.error(f"Invalid JSON in {filepath}. Deleting.")
        os.remove(filepath)
    except Exception as e:
        logging.error(f"Failed to process campaign {filepath}: {e}")

def start_campaign_polling_loop():
    logging.info("Starting BRMS WhatsApp Campaign Poller...")
    process_campaign_jobs()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_campaign_polling_loop()
