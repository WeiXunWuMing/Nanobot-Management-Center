---
name: context7
description: Real-time documentation lookup for libraries and frameworks. Use when you need up-to-date API docs or code examples for any library.
metadata: {"nanobot":{"emoji":"📚"}}
---
# Context7

Access up-to-date documentation for any library or framework.

## What is Context7?

Context7 provides real-time documentation lookup by searching the web for the latest docs. Unlike static documentation, Context7 always returns current information.

## Usage

When you need to:
- Look up API documentation for a library
- Find code examples for a specific function
- Check the latest syntax or parameters
- Verify deprecated features

Use the built-in `web_search` and `web_fetch` tools to get accurate, current information.

## How to Use

1. Identify the library/framework you need docs for
2. Use `web_search` to find the official documentation page
3. Use `web_fetch` to read the relevant documentation
4. Apply the information to your task

## Example

```
# Search for documentation
web_search("python requests library POST request examples")

# Fetch specific documentation page
web_fetch("https://docs.python-requests.org/en/latest/user/quickstart/")
```

## Best Practices

1. Always prefer official documentation over third-party sources
2. Check the version of the library you're working with
3. Verify examples work with the current API version
4. Cross-reference multiple sources if uncertain
