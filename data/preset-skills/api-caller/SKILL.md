---
name: api-caller
description: HTTP API calling tool. Use when you need to make REST API calls, interact with webhooks, or integrate with external services.
metadata: {"nanobot":{"emoji":"🔗"}}
---
# API Caller

Make HTTP requests to external APIs and services.

## Capabilities

- GET, POST, PUT, PATCH, DELETE requests
- JSON and form data support
- Custom headers
- Authentication (Bearer, Basic, API Key)
- File uploads
- Response parsing

## Python Requests

```python
import urllib.request
import json

# GET request
response = urllib.request.urlopen("https://api.example.com/data")
data = json.loads(response.read().decode())

# POST request with JSON
data = json.dumps({"key": "value"}).encode()
req = urllib.request.Request(
    "https://api.example.com/create",
    data=data,
    headers={"Content-Type": "application/json"}
)
response = urllib.request.urlopen(req)

# With authentication
req = urllib.request.Request(
    "https://api.example.com/protected",
    headers={"Authorization": "Bearer YOUR_TOKEN"}
)
```

## curl Commands

```bash
# GET
curl -X GET https://api.example.com/data

# POST with JSON
curl -X POST https://api.example.com/create \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'

# With authentication
curl -X GET https://api.example.com/protected \
  -H "Authorization: Bearer YOUR_TOKEN"

# File upload
curl -X POST https://api.example.com/upload \
  -F "file=@/path/to/file"
```

## Best Practices

1. Always handle errors and timeouts
2. Use appropriate HTTP methods
3. Include proper Content-Type headers
4. Validate response status codes
5. Parse JSON responses carefully
