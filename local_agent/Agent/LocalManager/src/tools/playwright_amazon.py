import os
import time
import logging
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth

def verify_amazon_review_playwright(product_url: str, reviewer_name: str, review_text: str) -> dict:
    """
    Uses a persistent stealth Chrome profile to check if a specific Amazon review exists.
    """
    profile_dir = os.getenv(
        "AMAZON_CHROME_PROFILE_DIR",
        os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../../../chrome_data_amazon")),
    )
    os.makedirs(profile_dir, exist_ok=True)
    
    with sync_playwright() as p:
        logging.info(f"Launching Stealth Chrome for Amazon search at {profile_dir}")
        context = p.chromium.launch_persistent_context(
            user_data_dir=profile_dir,
            headless=False, # Keep visible for captcha solving if required
            viewport={'width': 1280, 'height': 800},
            args=['--disable-blink-features=AutomationControlled']
        )
        
        page = context.pages[0] if len(context.pages) > 0 else context.new_page()
        Stealth().apply_stealth_sync(page)
        
        try:
            # First, check if the URL is valid
            if not product_url:
                logging.error("Product URL is completely empty.")
                return {"status": "error", "message": "Empty product URL."}
                
            if "amazon." not in product_url.lower():
                logging.warning(f"URL '{product_url}' does not contain 'amazon.'. Proceeding anyway for testing purposes.")
                
            logging.info(f"Navigating to: {product_url}")
            try:
                page.goto(product_url, timeout=60000, wait_until="domcontentloaded")
            except Exception as e:
                logging.warning(f"Timeout or network error during goto, proceeding anyway: {e}")
            page.wait_for_timeout(3000) # Give React time to hydrate DOM
            
            # Scroll down repeatedly to trigger lazy-loaded reviews
            logging.info("Scrolling down to trigger Amazon's lazy-loaded reviews...")
            for _ in range(5):
                page.mouse.wheel(0, 1500)
                page.wait_for_timeout(1000)
            
            def scan_current_page(p_num):
                logging.info(f"Scanning reviews on page {p_num}...")
                review_blocks = page.locator("*[data-hook='review']")
                block_count = review_blocks.count()
                for i in range(block_count):
                    block = review_blocks.nth(i)
                    try:
                        name_el = block.locator("span.a-profile-name").first
                        if name_el.count() == 0:
                            continue
                        
                        dom_name = name_el.inner_text().strip()
                        if reviewer_name.lower() in dom_name.lower() or dom_name.lower() in reviewer_name.lower():
                            logging.info(f"Potential name match found: {dom_name} vs {reviewer_name}")
                            text_el = block.locator("span[data-hook='review-body']").first
                            
                            if text_el.count() > 0:
                                dom_text = text_el.inner_text().strip()
                                match_chunk = review_text[:20].lower()
                                
                                if len(match_chunk) > 5 and match_chunk in dom_text.lower():
                                    logging.info("Text matched successfully! Taking screenshot of proof.")
                                    block.scroll_into_view_if_needed()
                                    time.sleep(1)
                                    proof_path = os.path.join(profile_dir, f"proof_{int(time.time())}.png")
                                    block.screenshot(path=proof_path)
                                    return proof_path
                    except Exception as e:
                        logging.error(f"Error parsing a review block: {e}")
                return None

            # First check the main product page
            proof = scan_current_page("Main Product Page")
            if proof:
                return {"status": "success", "message": f"Verified review by {reviewer_name}", "proof_image": proof}

            # If not found, try to click 'See all reviews'
            see_all_reviews = page.locator("a[data-hook='see-all-reviews-link-foot']")
            if see_all_reviews.count() > 0:
                logging.info("Clicking 'See all reviews' to search deeper...")
                see_all_reviews.first.scroll_into_view_if_needed()
                page.wait_for_timeout(1000)
                see_all_reviews.first.click()
                try:
                    page.wait_for_load_state("domcontentloaded", timeout=15000)
                except:
                    pass
                page.wait_for_timeout(2000)
                
                # Check for Amazon Login wall
                if "Sign-In" in page.title() or "Sign In" in page.title():
                    logging.warning("Hit Amazon Sign-In wall on reviews page! Cannot fetch older reviews.")
                else:
                    # Scan pagination
                    # We already scanned the main product page, so we start from page 1 of the dedicated reviews page.
                    # We'll check up to 4 more pages (total 5 pages including the first dedicated reviews page).
                    for page_num in range(1, 5): 
                        proof = scan_current_page(page_num)
                        if proof:
                            return {"status": "success", "message": f"Verified review by {reviewer_name}", "proof_image": proof}
                        
                        # Try to click next page
                        next_btn = page.locator("li.a-last a")
                        if next_btn.count() > 0 and not next_btn.get_attribute("class") == "a-disabled":
                            logging.info(f"Going to next review page ({page_num + 1})...")
                            next_btn.first.click()
                            try:
                                page.wait_for_load_state("domcontentloaded", timeout=10000)
                            except:
                                pass
                            page.wait_for_timeout(2000)
                        else:
                            logging.info("Reached end of review pages.")
                            break
            else:
                logging.warning("No 'See all reviews' link found to go deeper.")

            logging.info("Review could not be found after scanning the Amazon DOM.")
            return {"status": "not_found", "message": "The specified review was not present on the live Amazon page."}
                
        except Exception as e:
            logging.error(f"Playwright Amazon error: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            context.close()

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
