import os
import time
import logging
from playwright.sync_api import sync_playwright

def verify_amazon_review_playwright(product_url: str, reviewer_name: str, review_text: str) -> dict:
    """
    Uses Playwright's bundled Chromium (headless) to check if a specific Amazon review exists.
    Uses launch() instead of launch_persistent_context to avoid SIGTRAP crashes on macOS arm64.
    """
    with sync_playwright() as p:
        logging.info(f"Launching headless Chromium for Amazon review check")
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-blink-features=AutomationControlled",
                "--disable-extensions",
                "--disable-gpu",
            ]
        )
        context = browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent=(
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36"
            ),
            locale="en-IN",
            extra_http_headers={
                "Accept-Language": "en-IN,en;q=0.9",
            }
        )
        page = context.new_page()

        # Mask automation fingerprints
        page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1,2,3] });
        """)

        try:
            if not product_url:
                logging.error("Product URL is empty.")
                return {"status": "error", "message": "Empty product URL."}

            # Normalize URL — prepend https:// if no protocol is present
            if not product_url.startswith("http://") and not product_url.startswith("https://"):
                product_url = "https://" + product_url
                logging.info(f"Prepended https:// to URL → {product_url}")

            if "amazon." not in product_url.lower():
                logging.warning(f"URL '{product_url}' does not contain 'amazon.'. Proceeding anyway.")

            logging.info(f"Navigating to: {product_url}")
            try:
                page.goto(product_url, timeout=60000, wait_until="domcontentloaded")
            except Exception as e:
                logging.warning(f"Timeout or network error during goto, proceeding anyway: {e}")
            page.wait_for_timeout(3000)

            # Scroll to trigger lazy-loaded reviews
            logging.info("Scrolling to trigger lazy-loaded reviews...")
            for _ in range(5):
                page.mouse.wheel(0, 1500)
                page.wait_for_timeout(800)

            def scan_current_page(p_num):
                logging.info(f"Scanning reviews on page {p_num}...")
                review_blocks = page.locator("*[data-hook='review']")
                block_count = review_blocks.count()
                logging.info(f"Found {block_count} review blocks on page {p_num}")
                for i in range(block_count):
                    block = review_blocks.nth(i)
                    try:
                        name_el = block.locator("span.a-profile-name").first
                        if name_el.count() == 0:
                            continue

                        dom_name = name_el.inner_text().strip()
                        if reviewer_name.lower() in dom_name.lower() or dom_name.lower() in reviewer_name.lower():
                            logging.info(f"Potential name match: '{dom_name}' vs '{reviewer_name}'")
                            text_el = block.locator("span[data-hook='review-body']").first

                            if text_el.count() > 0:
                                dom_text = text_el.inner_text().strip()
                                match_chunk = review_text[:30].lower()

                                if len(match_chunk) > 5 and match_chunk in dom_text.lower():
                                    logging.info("Review text matched! Taking screenshot proof.")
                                    block.scroll_into_view_if_needed()
                                    page.wait_for_timeout(500)
                                    # Save proof screenshot to temp dir
                                    proof_dir = "/tmp/brms_review_proofs"
                                    os.makedirs(proof_dir, exist_ok=True)
                                    proof_path = os.path.join(proof_dir, f"proof_{int(time.time())}.png")
                                    block.screenshot(path=proof_path)
                                    return proof_path
                    except Exception as e:
                        logging.error(f"Error parsing review block {i}: {e}")
                return None

            # Check main product page first
            proof = scan_current_page("Main Page")
            if proof:
                return {"status": "success", "message": f"Verified review by '{reviewer_name}'", "proof_image": proof}

            # Navigate to all reviews page
            see_all = page.locator("a[data-hook='see-all-reviews-link-foot']")
            if see_all.count() > 0:
                logging.info("Clicking 'See all reviews'...")
                see_all.first.scroll_into_view_if_needed()
                page.wait_for_timeout(500)
                see_all.first.click()
                try:
                    page.wait_for_load_state("domcontentloaded", timeout=15000)
                except Exception:
                    pass
                page.wait_for_timeout(2000)

                if "sign-in" in page.title().lower():
                    logging.warning("Hit Amazon login wall on reviews page.")
                else:
                    for page_num in range(1, 5):
                        proof = scan_current_page(page_num)
                        if proof:
                            return {"status": "success", "message": f"Verified review by '{reviewer_name}'", "proof_image": proof}

                        next_btn = page.locator("li.a-last a")
                        if next_btn.count() > 0:
                            cls = next_btn.first.get_attribute("class") or ""
                            if "a-disabled" not in cls:
                                logging.info(f"Going to review page {page_num + 1}...")
                                next_btn.first.click()
                                try:
                                    page.wait_for_load_state("domcontentloaded", timeout=10000)
                                except Exception:
                                    pass
                                page.wait_for_timeout(2000)
                            else:
                                logging.info("Reached last review page.")
                                break
                        else:
                            logging.info("No next button found.")
                            break
            else:
                logging.warning("No 'See all reviews' link found.")

            logging.info("Review not found after scanning all available Amazon review pages.")
            return {"status": "not_found", "message": "Review not found on Amazon."}

        except Exception as e:
            logging.error(f"Playwright Amazon error: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            try:
                context.close()
                browser.close()
            except Exception:
                pass

if __name__ == "__main__":
    import sys
    logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
    if len(sys.argv) < 4:
        print("Usage: python3 playwright_amazon.py <product_url> <reviewer_name> <review_text>")
        sys.exit(1)
    
    url = sys.argv[1]
    name = sys.argv[2]
    text = sys.argv[3]
    
    result = verify_amazon_review_playwright(url, name, text)
    print(f"\nFINAL RESULT: {result}")
