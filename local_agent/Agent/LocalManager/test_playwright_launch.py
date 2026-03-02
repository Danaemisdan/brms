from playwright.sync_api import sync_playwright

def test():
    print("Testing standard launch...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto("https://www.google.com")
        print("Standard launch SUCCESS")
        browser.close()

    print("Testing persistent context launch...")
    with sync_playwright() as p:
        context = p.chromium.launch_persistent_context(
            user_data_dir="./tmp_chrome_data",
            headless=True
        )
        page = context.pages[0] if context.pages else context.new_page()
        page.goto("https://www.google.com")
        print("Persistent launch SUCCESS")
        context.close()

if __name__ == "__main__":
    test()
