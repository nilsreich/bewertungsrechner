from playwright.sync_api import sync_playwright

def verify_app(page):
    # Navigate to the app
    page.goto("http://localhost:3000")

    # Wait for the app to load
    page.wait_for_selector("#maxPoints")

    # Input exam title
    page.fill("#examTitle", "Debounce Test Exam")

    # Input max points
    page.fill("#maxPoints", "100")

    # Wait for the table to update (debounce 500ms + some buffer)
    page.wait_for_timeout(1000)

    # Verify table is updated (e.g. check for 96 points which is 96% of 100 for MSS 15)
    # The table has a cell with 96% and one with 96.00 or similar.
    # MSS 15 -> 96% -> 96 points.

    # Take screenshot
    page.screenshot(path="verification.png")
    print("Screenshot taken")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_app(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
