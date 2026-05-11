---
name: context7
description: Real-time documentation lookup for libraries and frameworks. Use when you need up-to-date API docs or code examples for any library.
metadata: {"nanobot":{"emoji":"📚"}}
---
# Context7

Access up-to-date documentation for any library or framework.

## What is Context7?

Context7 provides real-time documentation lookup by fetching the latest docs directly from source. Unlike static documentation, Context7 always returns current information.

## Usage

When you need to:
- Look up API documentation for a library
- Find code examples for a specific function
- Check the latest syntax or parameters
- Verify deprecated features

Use Context7 to get accurate, current information.

## How to Use

1. Identify the library/framework you need docs for
2. Use web_fetch to access Context7's documentation endpoint
3. Parse the returned documentation
4. Apply the information to your task

## Example

```python
# Fetch documentation for a specific function
import urllib.request
url = "https://context7.com/api/docs/library-name/function-name"
response = urllib.request.urlopen(url)
docs = response.read().decode()
```

## Supported Libraries

Context7 supports documentation for:
- Python packages (PyPI)
- npm packages
- Go modules
- Rust crates
- And more...
