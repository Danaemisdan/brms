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
            if not product_url or "amazon." not in product_url.lower():
                return {"status": "error", "message": "Invalid Amazon product URL."}
                
            logging.info(f"Navigating to: {product_url}")
            page.goto(product_url, timeout=60000)
            
            # Click on 'See all reviews' link to go to the dedicated reviews page
            see_all_reviews = page.locator("a[data-hook='see-all-reviews-link-foot']").first
            if see_all_reviews.count() > 0:
                see_all_reviews.click()
                page.wait_for_load_state("networkidle")
            else:
                logging.warning("Could not find 'See all reviews' link. Attempting search on current page.")

            # Look through up to 5 pages of reviews
            max_pages = 5
            found = False
            
            for page_num in range(1, max_pages + 1):
                logging.info(f"Scanning reviews on page {page_num}...")
                
                # Check for matching reviewer name
                review_blocks = page.locator("div[data-hook='review']")
                block_count = review_blocks.count()
                
                for i in range(block_count):
                    block = review_blocks.nth(i)
                    
                    try:
                        name_el = block.locator("span.a-profile-name").first
                        if name_el.count() == 0:
                            continue
                            
                        dom_name = name_el.inner_text().strip()
                        
                        # Soft match on name (e.g., 'John Smith' vs 'John S')
                        if reviewer_name.lower() in dom_name.lower() or dom_name.lower() in reviewer_name.lower():
                            logging.info(f"Potential name match found: {dom_name} vs {reviewer_name}")
                            text_el = block.locator("span[data-hook='review-body']").first
                            
                            if text_el.count() > 0:
                                dom_text = text_el.inner_text().strip()
                                
                                # Verify the review text. 
                                # Use a subset match since the VLM might hallucinate minor punctuation 
                                # or the customer might have edited the review slightly.
                                # Check if a significant chunk (e.g. first 20 chars) matches
                                match_chunk = review_text[:20].lower()
                                
                                if len(match_chunk) > 5 and match_chunk in dom_text.lower():
                                    logging.info("Text matched successfully! Taking screenshot of proof.")
                                    # Scroll the block into view and take a screenshot
                                    block.scroll_into_view_if_needed()
                                    time.sleep(1) # let rendering settle
                                    
                                    proof_path = os.path.join(profile_dir, f"proof_{int(time.time())}.png")
                                    block.screenshot(path=proof_path)
                                    
                                    found = True
                                    return {
                                        "status": "success",
                                        "message": f"Verified review by {dom_name}",
                                        "proof_image": proof_path
                                    }
                    except Exception as e:
                        logging.warning(f"Error parsing a review block: {e}")
                        continue
                        
                # If not found on this page, click next
                next_btn = page.locator("li.a-last a").first
                if next_btn.count() > 0 and not next_btn.get_attribute("class") == "a-disabled":
                    logging.info("Going to next review page...")
                    next_btn.click()
                    time.sleep(2)
                    page.wait_for_load_state("networkidle")
                else:
                    logging.info("Reached end of review pages.")
                    break
                    
            if not found:
                logging.info("Review could not be found after scanning the Amazon DOM.")
                return {"status": "not_found", "message": "The specified review was not present on the live Amazon page."}
                
        except Exception as e:
            logging.error(f"Playwright Amazon error: {e}")
            return {"status": "error", "message": str(e)}
        finally:
            context.close()
