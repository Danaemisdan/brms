import os
import time
import json
import base64
import logging
import tempfile
from typing import Any, Dict, Optional

import requests
from dotenv import load_dotenv

from src.tools.playwright_amazon import verify_amazon_review_playwright
from src.vision import _run_vlm

load_dotenv()

BRMS_API_URL = os.getenv("BRMS_API_URL", "http://localhost:5001").rstrip("/")
AGENT_SECRET_KEY = os.getenv("AGENT_SECRET_KEY", "")
WORKER_ID = os.getenv("AGENT_REVIEW_WORKER_ID", "review-verifier")
POLL_SECONDS = int(os.getenv("REVIEW_VERIFY_POLL_SECONDS", "10"))
RETRY_SECONDS = int(os.getenv("REVIEW_VERIFY_RETRY_SECONDS", "60"))

logger = logging.getLogger(__name__)

def extract_review_details_vlm(screenshot_data: str) -> dict:
    """
    Takes a base64 encoded screenshot, saves it to a temp file, and uses the local VLM to extract the reviewer name and review text.
    """
    logger.info("Sending screenshot to Local Vision LLM for text extraction...")

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
            logger.info(f"Local VLM Extracted: {data}")
            return data
            
        logger.error(f"Failed to extract matching JSON from VLM. Raw output: {output}")
        return {"error": "Failed to parse VLM output", "raw": output}
        
    except Exception as e:
        logger.error(f"Failed to extract review details with local VLM: {e}")
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_image_path):
            os.remove(temp_image_path)

def _headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {AGENT_SECRET_KEY}",
        "Content-Type": "application/json",
    }

def _claim_review_task() -> Optional[Dict[str, Any]]:
    if not AGENT_SECRET_KEY:
        logger.error("AGENT_SECRET_KEY is missing. Cannot claim review tasks.")
        return None

    try:
        resp = requests.get(
            f"{BRMS_API_URL}/api/refunds/tasks/next",
            headers=_headers(),
            params={"type": "REVIEW_VERIFY", "worker_id": WORKER_ID},
            timeout=15,
        )
        if resp.status_code != 200:
            logger.error("Failed to claim review task: %s", resp.text)
            return None
        return resp.json().get("task")
    except Exception as exc:
        logger.error("Review task claim request failed: %s", exc)
        return None

def _complete_task(task_id: str, status: str, result: Dict[str, Any], retry_after_seconds: Optional[int] = None) -> None:
    if not AGENT_SECRET_KEY:
        return

    payload: Dict[str, Any] = {
        "status": status,
        "result": result,
    }
    if retry_after_seconds is not None:
        payload["retry_after_seconds"] = retry_after_seconds

    try:
        resp = requests.post(
            f"{BRMS_API_URL}/api/refunds/tasks/{task_id}/complete",
            headers=_headers(),
            json=payload,
            timeout=15,
        )
        if resp.status_code != 200:
            logger.error("Failed to complete review task %s: %s", task_id, resp.text)
    except Exception as exc:
        logger.error("Complete review task request failed (%s): %s", task_id, exc)

def _send_verify_callback(review_id: str, payload: Dict[str, Any]) -> bool:
    try:
        resp = requests.post(
            f"{BRMS_API_URL}/api/refunds/reviews/{review_id}/verify_callback",
            headers=_headers(),
            json=payload,
            timeout=15,
        )
        if resp.status_code != 200:
            logger.error("Verification callback failed for review %s: %s", review_id, resp.text)
            return False
        return True
    except Exception as exc:
        logger.error("Verification callback request error for review %s: %s", review_id, exc)
        return False

def _process_task(task: Dict[str, Any]) -> None:
    task_id = str(task.get("id", ""))
    payload = task.get("payload") or {}
    review_id = str(payload.get("review_id", ""))
    product_url = str(payload.get("product_url", ""))
    screenshot_data = str(payload.get("screenshot_data", ""))

    if not task_id or not review_id or not product_url or not screenshot_data:
        logger.error("Invalid REVIEW_VERIFY payload for task %s: %s", task_id, payload)
        if task_id:
            _complete_task(
                task_id,
                "FAILED",
                {"error": "Invalid REVIEW_VERIFY payload", "payload": payload},
            )
        return

    callback_payload: Dict[str, Any]
    verification_result: Dict[str, Any] = {"status": "error", "message": "Verification not executed"}

    try:
        extracted_data = extract_review_details_vlm(screenshot_data)
        if "error" in extracted_data:
            callback_payload = {
                "status": "REJECTED",
                "reason": f"VLM extraction failed: {extracted_data.get('error')}",
            }
        else:
            reviewer_name = str(extracted_data.get("reviewer_name", "")).strip()
            review_text = str(extracted_data.get("review_text", "")).strip()
            if not reviewer_name or not review_text:
                callback_payload = {
                    "status": "REJECTED",
                    "reason": "VLM extraction returned empty reviewer name or review text.",
                }
            else:
                logger.info("Extracted review details. Reviewer='%s'", reviewer_name)
                verification_result = verify_amazon_review_playwright(
                    product_url=product_url,
                    reviewer_name=reviewer_name,
                    review_text=review_text,
                )
                callback_payload = {
                    "status": "APPROVED" if verification_result.get("status") == "success" else "REJECTED",
                    "reason": verification_result.get("message", ""),
                    "proof_image": verification_result.get("proof_image", ""),
                }

        if _send_verify_callback(review_id, callback_payload):
            _complete_task(
                task_id,
                "COMPLETED",
                {
                    "callback_payload": callback_payload,
                    "verification_result": verification_result,
                },
            )
        else:
            _complete_task(
                task_id,
                "PENDING",
                {"error": "verify_callback request failed", "callback_payload": callback_payload},
                retry_after_seconds=RETRY_SECONDS,
            )
    except Exception as exc:
        logger.error("Unhandled REVIEW_VERIFY processing error for task %s: %s", task_id, exc)
        _complete_task(
            task_id,
            "PENDING",
            {"error": str(exc)},
            retry_after_seconds=RETRY_SECONDS,
        )

def process_review_verification_jobs() -> None:
    while True:
        task = _claim_review_task()
        if not task:
            time.sleep(POLL_SECONDS)
            continue

        logger.info("Claimed review verification task: %s", task.get("id"))
        _process_task(task)

def start_verification_polling_loop():
    logger.info("Starting BRMS Amazon Review Verification Poller...")
    process_review_verification_jobs()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_verification_polling_loop()
