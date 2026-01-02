from playwright.sync_api import sync_playwright

def verify_familiar_guide_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(ignore_https_errors=True)
        page = context.new_page()

        page.goto("https://localhost:5173/#leitura-guia-familiar")

        # Verify content from leitura-guia-familiar.html
        page.wait_for_selector("h1:has-text('Base de Conhecimento Abrangente sobre Saúde Familiar')")

        page.screenshot(path="verification/familiar_guide_page.png")

        browser.close()

if __name__ == "__main__":
    verify_familiar_guide_page()
