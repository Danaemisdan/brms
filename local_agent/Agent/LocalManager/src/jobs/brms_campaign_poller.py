import os
import time
import logging
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

from src.tools.playwright_whatsapp import send_whatsapp_message_playwright

load_dotenv()

BRMS_API_URL = os.getenv("BRMS_API_URL", "http://localhost:5001").rstrip("/")
AGENT_SECRET_KEY = os.getenv("AGENT_SECRET_KEY", "")
WORKER_ID = os.getenv("AGENT_WHATSAPP_WORKER_ID", "whatsapp-campaign")
POLL_SECONDS = int(os.getenv("WHATSAPP_POLL_SECONDS", "10"))
RETRY_SECONDS = int(os.getenv("WHATSAPP_RETRY_SECONDS", "60"))

logger = logging.getLogger(__name__)

def _headers() -> Dict[str, str]:
    return {
        "Authorization": f"Bearer {AGENT_SECRET_KEY}",
        "Content-Type": "application/json",
    }

def _claim_campaign_task() -> Optional[Dict[str, Any]]:
    if not AGENT_SECRET_KEY:
        logger.error("AGENT_SECRET_KEY is missing. Cannot claim WhatsApp tasks.")
        return None

    try:
        resp = requests.get(
            f"{BRMS_API_URL}/api/refunds/tasks/next",
            headers=_headers(),
            params={"type": "WHATSAPP_BLAST", "worker_id": WORKER_ID},
            timeout=15,
        )
        if resp.status_code != 200:
            logger.error("Failed to claim WhatsApp task: %s", resp.text)
            return None
        return resp.json().get("task")
    except Exception as exc:
        logger.error("WhatsApp task claim request failed: %s", exc)
        return None

def _complete_task(task_id: str, status: str, result: Dict[str, Any], retry_after_seconds: Optional[int] = None) -> None:
    payload: Dict[str, Any] = {"status": status, "result": result}
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
            logger.error("Failed to complete WhatsApp task %s: %s", task_id, resp.text)
    except Exception as exc:
        logger.error("Complete WhatsApp task request failed (%s): %s", task_id, exc)

def _parse_recipients(payload: Dict[str, Any]) -> List[str]:
    recipients = payload.get("recipients")
    if isinstance(recipients, list):
        clean = [str(item).strip() for item in recipients if str(item).strip()]
        if clean:
            return clean

    custom_phones = str(payload.get("custom_phones", "")).strip()
    if custom_phones:
        return [item.strip() for item in custom_phones.split(",") if item.strip()]
    return []

def _process_campaign_task(task: Dict[str, Any]) -> None:
    task_id = str(task.get("id", ""))
    payload = task.get("payload") or {}
    message = str(payload.get("message", "")).strip()
    recipients = _parse_recipients(payload)

    if not task_id or not message or not recipients:
        logger.error("Invalid WHATSAPP_BLAST payload for task %s: %s", task_id, payload)
        if task_id:
            _complete_task(task_id, "FAILED", {"error": "Invalid WHATSAPP_BLAST payload", "payload": payload})
        return

    attachment_url = str(payload.get("attachment_url", "")).strip()
    attachment_path = None
    if attachment_url and attachment_url.lower() != "none" and attachment_url.lower() != "null":
        import requests
        import tempfile
        import os
        try:
            # Prepend API_URL if it is a relative path
            if attachment_url.startswith("/"):
                base_url = os.getenv("API_URL", "http://localhost:5001").rstrip("/")
                attachment_url = f"{base_url}{attachment_url}"
            resp = requests.get(attachment_url, timeout=10)
            if resp.status_code == 200:
                ext = attachment_url.split(".")[-1]
                if "?" in ext: ext = ext.split("?")[0]
                fd, path = tempfile.mkstemp(suffix=f".{ext}")
                with os.fdopen(fd, 'wb') as f:
                    f.write(resp.content)
                attachment_path = path
        except Exception as e:
            logger.error("Failed to download attachment %s: %s", attachment_url, e)

    sent_results: List[Dict[str, Any]] = []
    failed_count = 0

    for idx, contact in enumerate(recipients):
        logger.info("[%s/%s] Sending WhatsApp campaign message to: %s", idx + 1, len(recipients), contact)
        try:
            result_json = send_whatsapp_message_playwright(contact=contact, message=message, attachment_path=attachment_path)
            sent_results.append({"contact": contact, "result": result_json})
            if result_json.get("status") != "success":
                failed_count += 1
            logger.info("Send result for %s: %s", contact, result_json)
            time.sleep(5)
        except Exception as exc:
            failed_count += 1
            sent_results.append({"contact": contact, "result": {"status": "error", "message": str(exc)}})
            logger.error("Send error for %s: %s", contact, exc)

    if failed_count == 0:
        _complete_task(task_id, "COMPLETED", {"results": sent_results, "failed_count": 0})
        return

    if failed_count == len(recipients):
        _complete_task(
            task_id,
            "PENDING",
            {"results": sent_results, "failed_count": failed_count},
            retry_after_seconds=RETRY_SECONDS,
        )
        return

    _complete_task(task_id, "COMPLETED", {"results": sent_results, "failed_count": failed_count})

    # Clean up temp attachment file
    if attachment_path and os.path.exists(attachment_path):
        try:
            os.remove(attachment_path)
        except Exception as e:
            logger.warning("Could not delete temp attachment %s: %s", attachment_path, e)

def process_campaign_jobs() -> None:
    while True:
        task = _claim_campaign_task()
        if not task:
            time.sleep(POLL_SECONDS)
            continue
        logger.info("Claimed WhatsApp campaign task: %s", task.get("id"))
        _process_campaign_task(task)

def start_campaign_polling_loop() -> None:
    logger.info("Starting BRMS WhatsApp Campaign Poller...")
    process_campaign_jobs()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    start_campaign_polling_loop()
