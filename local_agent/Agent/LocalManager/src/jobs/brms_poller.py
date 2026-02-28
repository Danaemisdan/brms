import time
import requests
import logging
from src.tools.macos_ui import _send_whatsapp_message

# BRMS Integration config
BRMS_API_URL = "http://localhost:5001"
AGENT_SECRET_KEY = "brms_local_agent_secret_2026"

logger = logging.getLogger(__name__)

def poll_brms_refunds():
    """
    Polls the BRMS backend for approved refunds and natively sends
    WhatsApp messages to the customers with their refund details.
    """
    logger.info("Checking BRMS for pending refunds...")
    headers = {
        "Authorization": f"Bearer {AGENT_SECRET_KEY}",
        "Content-Type": "application/json"
    }

    try:
        # 1. Fetch pending refunds queue
        resp = requests.get(f"{BRMS_API_URL}/api/refunds/queue", headers=headers, timeout=10)
        if resp.status_code != 200:
            logger.error(f"Failed to fetch refunds queue: {resp.text}")
            return
            
        data = resp.json()
        queue = data.get("queue", [])
        
        if not queue:
            return

        logger.info(f"Found {len(queue)} pending refunds to process.")

        # 2. Process each refund
        for job in queue:
            refund_id = job.get("refund_id")
            amount = job.get("amount")
            name = job.get("customer_name")
            mobile = job.get("mobile")
            product = job.get("product_name")
            method = job.get("method")
            bank = job.get("bank_details")

            # Format the payment details for the message
            payment_str = f"your {method} account"
            if method == "UPI" and bank and "upi_id" in bank:
                payment_str = f"your UPI ID ({bank['upi_id']})"
            elif method == "BANK" and bank and "bank_account" in bank:
                # Mask account number
                acc = bank["bank_account"]
                masked = f"X{acc[-4:]}" if len(acc) >= 4 else acc
                payment_str = f"your Bank Account ({masked})"

            # Construct the exact WhatsApp message to send
            message = (
                f"Hi {name}, your refund of ₹{amount} for the '{product}' campaign "
                f"ha been successfully processed to {payment_str}. "
                f"Thank you for participating!"
            )

            logger.info(f"Sending WhatsApp message to {mobile} for Refund ID {refund_id}...")

            # 3. Trigger AppleScript / UI Automation to send the message natively
            result_json = _send_whatsapp_message(
                contact=mobile,
                message=message,
                force_send=True,
                assume_chat_open=False,
                confirm_contact_only=False
            )

            # 4. Check if the send was successful
            import json
            try:
                res_data = json.loads(result_json)
                status = res_data.get("status")
                
                if status == "ok":
                    logger.info(f"Successfully messaged {mobile}. Closing loop with backend.")
                    # 5. Tell the backend to mark it as REFUNDED
                    comp_resp = requests.post(
                        f"{BRMS_API_URL}/api/refunds/queue/{refund_id}/complete",
                        headers=headers,
                        json={"status": "REFUNDED", "remarks": "Automated WhatsApp message sent."},
                        timeout=5
                    )
                    if comp_resp.status_code != 200:
                        logger.error(f"Failed to close loop for {refund_id}: {comp_resp.text}")
                else:
                    logger.error(f"WhatsApp sending failed for {mobile}: {res_data.get('message')}")
                    requests.post(
                        f"{BRMS_API_URL}/api/refunds/queue/{refund_id}/complete",
                        headers=headers,
                        json={"status": "FAILED", "remarks": f"WhatsApp Error: {res_data.get('message')}"},
                        timeout=5
                    )

            except Exception as e:
                logger.error(f"Failed to parse result or update status: {e}")
                
            # Sleep briefly between messages to avoid spamming the UI
            time.sleep(5)

    except Exception as e:
        logger.error(f"Error during BRMS polling loop: {e}")


def start_polling_loop():
    logger.info("Started BRMS WhatsApp background worker.")
    while True:
        try:
            poll_brms_refunds()
        except Exception as e:
            logger.error(f"Critical poller crash: {e}")
        time.sleep(30)  # Check every 30 seconds
