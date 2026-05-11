---
name: agent-browser
description: Browser automation skill using Playwright. Use when you need to browse websites, fill forms, take screenshots, or interact with web pages.
metadata: {"nanobot":{"emoji":"🌐","requires":{"bins":["playwright"]}}}
---
# Agent Browser

Automate browser interactions using Playwright.

## Capabilities

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

Use the browser tools to accomplish these tasks.

## Commands

```bash
# Install Playwright browsers
playwright install chromium

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

1. Always close the browser when done
2. Use headless mode for background tasks
3. Handle timeouts gracefully
4. Take screenshots for debugging
