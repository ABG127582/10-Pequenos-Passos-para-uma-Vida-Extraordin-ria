from playwright.sync_api import sync_playwright

def verify_familiar_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use ignore_https_errors=True for self-signed certificates
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()

        # Navigate to the app (assuming default Vite port)
        # Using hash navigation as per memory instructions
        page.goto("https://localhost:5173/#familiar")

        # Wait for content to load
        # Check for specific content from familiar.html
        page.wait_for_selector("h1:has-text('PDCA Saúde Familiar')")

        # Take a screenshot
        page.screenshot(path="verification/familiar_page.png")

        browser.close()

if __name__ == "__main__":
    verify_familiar_page()
