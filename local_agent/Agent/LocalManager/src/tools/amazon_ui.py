import json
import logging
import re
import time
from typing import Optional, Dict

from src.tools.macos_ui import _get_cdp_browser, _capture_fullscreen, _payload
from src.vision import _run_vlm, _resize_image

logger = logging.getLogger(__name__)


def _normalize(text: str) -> str:
    """Normalize text for fuzzy matching by removing excess whitespace and lowercasing."""
    if not text:
        return ""
    # Remove non-alphanumeric characters for a very loose fuzzy match
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text.lower())
    return " ".join(text.split())


def _extract_review_details_from_image(image_path: str) -> Optional[Dict[str, str]]:
    """Uses the local VLM to extract the reviewer name and review text from a screenshot."""
    prompt = (
        "You are given a screenshot of an Amazon product review. "
        "Extract the reviewer's name and the main body text of the review. "
        "Return ONLY a JSON object with keys 'reviewer_name' (string) and 'review_text' (string). "
        "If you cannot find a review, return empty strings."
    )
    resized = _resize_image(image_path)
    data, output = _run_vlm(resized, prompt)
    if data and isinstance(data, dict):
        return data
    
    # Try parsing manually if VLM forgot the JSON structure but outputted something close
    try:
        start = output.find("{")
        end = output.rfind("}")
        if start != -1 and end != -1:
            return json.loads(output[start:end+1])
    except Exception:
        pass
        
    return None


def verify_amazon_review(product_url: str, review_image_path: str) -> str:
    """Verifies if an Amazon review exists on a product page by matching against a screenshot.
    
    Args:
        product_url: The URL of the Amazon product page.
        review_image_path: Absolute path to the screenshot of the review.
    """
    from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError

    # 1. Extract details using VLM
    details = _extract_review_details_from_image(review_image_path)
    if not details or not details.get("review_text"):
        return _payload("error", "Could not extract review text from the provided image using Vision AI.")
    
    target_name = _normalize(details.get("reviewer_name", ""))
    target_text = _normalize(details.get("review_text", ""))
    
    if len(target_text) < 10:
        return _payload("error", "Extracted review text is too short to accurately verify.")

    with sync_playwright() as p:
        # 2. Use the persistent CDP Chrome profile to avoid Amazon bot detection
        browser = _get_cdp_browser(p)
        if isinstance(browser, str):
            return _payload("error", f"Could not connect to Chrome to browse Amazon: {browser}")

        try:
            context = browser.contexts[0]
            page = context.new_page()
            
            # 3. Navigate to the product page
            try:
                page.goto(product_url, wait_until="domcontentloaded", timeout=30000)
            except PlaywrightTimeoutError:
                return _payload("error", "Timeout loading the Amazon product page.")
            
            time.sleep(3) # Let anti-bot scripts run
            
            # Check for captchas
            captcha = page.locator('form[action="/errors/validateCaptcha"]')
            if captcha.count() > 0:
                page.close()
                return _payload("error", "Amazon requires a CAPTCHA. Cannot verify at this time.")

            # 4. Try to navigate to the "See all reviews" page directly if possible
            # Often, appending &scrollTo=customerReviews helps, but the safest is finding the link
            all_reviews_link = page.locator('a[data-hook="see-all-reviews-link-foot"]')
            if all_reviews_link.count() > 0:
                href = all_reviews_link.first.get_attribute("href")
                if href:
                    if not href.startswith("http"):
                        href = "https://www.amazon.com" + href
                    page.goto(href, wait_until="domcontentloaded", timeout=20000)
                    time.sleep(2)
            
            # 5. Iterate through review pages
            max_pages = 10
            found = False
            
            for page_num in range(max_pages):
                # Wait for reviews to be visible
                try:
                    page.wait_for_selector('div[data-hook="review"]', timeout=5000)
                except PlaywrightTimeoutError:
                    # No reviews on this page, maybe we are at the end
                    break
                
                # Extract all review blocks via JS for resilience against DOM flakiness
                reviews_data = page.evaluate('''() => {
                    const reviews = document.querySelectorAll('div[data-hook="review"]');
                    const data = [];
                    for (const rev of reviews) {
                        const nameEl = rev.querySelector('.a-profile-name');
                        const bodyEl = rev.querySelector('span[data-hook="review-body"]');
                        data.push({
                            name: nameEl ? nameEl.innerText : "",
                            body: bodyEl ? bodyEl.innerText : ""
                        });
                    }
                    return data;
                }''')
                
                # Check for matches
                for rev in reviews_data:
                    dom_name = _normalize(rev.get("name", ""))
                    dom_body = _normalize(rev.get("body", ""))
                    
                    # We check if a significant portion of the target text is in the DOM body
                    # because VLMs occasionally hallucinate a word, and DOM might truncate
                    
                    # Exact substring match check first
                    if target_text in dom_body or dom_body in target_text:
                        found = True
                        break
                    
                    # Word overlap check (fuzzy match)
                    target_words = set(target_text.split())
                    dom_words = set(dom_body.split())
                    
                    if target_words and dom_words:
                        overlap = len(target_words.intersection(dom_words))
                        # If more than 80% of words match, we consider it the same review
                        if overlap / len(target_words) > 0.8:
                            found = True
                            break
                            
                if found:
                    break
                    
                # Not found yet, try to go to the next page
                next_button = page.locator('.a-pagination .a-last a')
                if next_button.count() > 0:
                    href = next_button.first.get_attribute("href")
                    if href:
                        if not href.startswith("http"):
                            href = "https://www.amazon.com" + href
                        page.goto(href, wait_until="domcontentloaded", timeout=20000)
                        time.sleep(2)
                    else:
                        break
                else:
                    # No more pagination
                    break
            
            # Clean up
            try:
                page.close()
            except Exception:
                pass
                
            if found:
                return _payload("ok", f"✅ Confirmed: The review by '{details.get('reviewer_name', 'User')}' exists on this Amazon product.")
            else:
                return _payload("not_found", f"❌ Could not find a matching review in the first {max_pages} pages of recent/top reviews.", screenshot_path=_capture_fullscreen())

        finally:
            if hasattr(browser, 'close'):
                try:
                    browser.close()
                except Exception:
                    pass

TOOLS_SCHEMA = [
    {
        "type": "function",
        "function": {
            "name": "verify_amazon_review",
            "description": "Verifies if an Amazon review exists on a product page by matching against a screenshot of the review.",
            "parameters": {
                "type": "object",
                "properties": {
                    "product_url": {
                        "type": "string",
                        "description": "The URL of the Amazon product page."
                    },
                    "review_image_path": {
                        "type": "string",
                        "description": "Absolute path to the image containing the screenshot of the review."
                    }
                },
                "required": ["product_url", "review_image_path"]
            }
        }
    }
]

AVAILABLE_TOOLS = {
    "verify_amazon_review": verify_amazon_review,
}
