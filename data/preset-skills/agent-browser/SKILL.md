---
name: agent-browser
description: Browser automation skill using Playwright. Use when you need to browse websites, fill forms, take screenshots, or interact with web pages.
metadata: {"nanobot":{"emoji":"🌐"}}
---
# Agent Browser

Automate browser interactions using Playwright.

## IMPORTANT: Check Playwright First

Before attempting any browser automation, **always check if Playwright is installed**:

```bash
python3 -c "from playwright.sync_api import sync_playwright; print('OK')" 2>&1
```

### If Playwright IS installed:
- Use Playwright for full browser automation (navigate, click, fill forms, screenshot)

### If Playwright is NOT installed:
- **DO NOT try to install it** (it takes too long and may fail)
- **IMMEDIATELY fall back to these alternatives:**
  - `web_fetch` - to get page content
  - `web_search` - to search for information
  - `exec` with `curl` - for API calls
- Tell the user: "Playwright is not installed. Using web search/fetch instead. To enable full browser automation, recreate the instance with 'Pre-install Playwright' checked."

## Capabilities (when Playwright is installed)

- Navigate to URLs
- Click elements, fill forms
- Take screenshots
- Extract text from pages
- Wait for elements to load
- Handle popups and alerts

## Usage

When the user asks you to:
- Visit a website and extract information
- Fill out a web form
- Take a screenshot of a page
- Interact with web elements
- Test a web application

If Playwright is available, use it. Otherwise, use web_fetch/web_search.

## Playwright Commands (only if installed)

```bash
# Run a browser script
python3 -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto('https://example.com')
    print(page.title())
    browser.close()
"
```

## Best Practices

1. Always check Playwright availability first
2. If not installed, skip installation and use alternatives
3. Close the browser when done
4. Use headless mode for background tasks
5. Handle timeouts gracefully
6. Take screenshots for debugging
