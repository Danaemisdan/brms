import os
import json
import time
import logging
import base64
import requests
from dotenv import load_dotenv
from src.tools.playwright_amazon import verify_amazon_review_playwright

# Load ENV from the python local_agent context if needed
load_dotenv()

AGENT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../"))

from src.vision import _run_vlm
import tempfile

def extract_review_details_vlm(screenshot_data: str) -> dict:
    """
    Takes a base64 encoded screenshot, saves it to a temp file, and uses the local VLM to extract the reviewer name and review text.
    """
    logging.info("Sending screenshot to Local Vision LLM for text extraction...")

    # Ensure clean base64 string
    img_b64 = screenshot_data
    if img_b64.startswith("data:image"):
        img_b64 = img_b64.split(",")[1]

    temp_image_path = os.path.join(tempfile.gettempdir(), f"vlm_extract_{int(time.time())}.jpg")
    
    try:
        with open(temp_image_path, "wb") as f:
            f.write(base64.b64decode(img_b64))
            
        prompt = (
            "Extract the Reviewer's Name and the exact Review Text from this Amazon review screenshot. "
            "Return ONLY a valid strictly formatted JSON object with the keys 'reviewer_name' and 'review_text'. "
            "Do not include any other markdown or text."
        )

        data, output = _run_vlm(temp_image_path, prompt)
        
        if data and "reviewer_name" in data and "review_text" in data:
            logging.info(f"Local VLM Extracted: {data}")
            return data
            
        logging.error(f"Failed to extract matching JSON from VLM. Raw output: {output}")
        return {"error": "Failed to parse VLM output", "raw": output}
        
    except Exception as e:
        logging.error(f"Failed to extract review details with local VLM: {e}")
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)

def process_review_verification_jobs():
    while True:
        try:
            if not os.path.exists(AGENT_DIR):
                time.sleep(10)
                continue

            for filename in os.listdir(AGENT_DIR):
                if filename.startswith("verify_review_") and filename.endswith(".json"):
                    filepath = os.path.join(AGENT_DIR, filename)
                    process_single_verification(filepath)
            
        except Exception as e:
            logging.error(f"Error checking for verification jobs: {e}")
        
        time.sleep(10)

def process_single_verification(filepath: str):
    logging.info(f"Picked up Amazon Verify Review command: {filepath}")
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)

        command = data.get("command")
        if command != "VERIFY_REVIEW":
            logging.warning(f"Unknown command {command} in {filepath}. Deleting.")
            os.remove(filepath)
            return

        review_id = data.get("review_id")
        product_url = data.get("product_url")
        screenshot_url = data.get("screenshot_url")

        # 1. Vision LLM Extraction
        extracted_data = extract_review_details_vlm(screenshot_url)
        if "error" in extracted_data:
            logging.error(f"VLM Extraction failed for {filepath}. Cannot proceed with DOM check.")
            webhook_url = f"http://localhost:5001/api/refunds/reviews/{review_id}/verify_callback"
            try:
                requests.post(webhook_url, json={
                    "status": "REJECTED", 
                    "reason": f"VLM Extraction Failed: {extracted_data.get('error')}"
                }, headers={'Authorization': f'Bearer {os.getenv("AGENT_SECRET_KEY", "brms_local_agent_secret_2026")}'})
            except Exception as e:
                pass
            os.remove(filepath)
            return

        reviewer_name = extracted_data.get("reviewer_name", "")
        review_text = extracted_data.get("review_text", "")

        logging.info(f"Extracted Name: '{reviewer_name}' | Extracted Text: '{review_text[:30]}...'")

        # 2. Playwright DOM Search
        verification_result = verify_amazon_review_playwright(
            product_url=product_url,
            reviewer_name=reviewer_name,
            review_text=review_text
        )
        
        logging.info(f"Verification Result: {verification_result['status']} | {verification_result.get('message')}")

        # 3. Hit Backend Webhook with verdict
        webhook_url = f"http://localhost:5001/api/refunds/reviews/{review_id}/verify_callback"
        
        callback_payload = {
            "status": "APPROVED" if verification_result["status"] == "success" else "REJECTED",
            "reason": verification_result.get("message", ""),
            "proof_image": verification_result.get("proof_image", "") # Local file path returned by playwright
        }
        
        try:
            logging.info(f"Sending callback to backend: {webhook_url}")
            # In a real setup, we would send a secret token
            resp = requests.post(webhook_url, json=callback_payload, headers={'Authorization': f'Bearer {os.getenv("AGENT_SECRET_KEY", "brms_local_agent_secret_2026")}'})
            resp.raise_for_status()
            logging.info("Backend acknowledged the verification result.")
        except Exception as api_err:
            logging.error(f"Failed to hit backend webhook: {api_err}")

        os.remove(filepath)

    except json.JSONDecodeError:
        logging.error(f"Invalid JSON in {filepath}. Deleting.")
        os.remove(filepath)
    except Exception as e:
        logging.error(f"Failed to process verification {filepath}: {e}")

def start_verification_polling_loop():
    logging.info("Starting BRMS Amazon Review Verification Poller...")
    process_review_verification_jobs()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_verification_polling_loop()
