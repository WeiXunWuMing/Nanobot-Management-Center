---
name: tavily
description: AI-optimized web search using Tavily API. Use when you need high-quality search results optimized for AI consumption.
metadata: {"nanobot":{"emoji":"🔍","requires":{"env":["TAVILY_API_KEY"]}}}
---
# Tavily Search

AI-optimized web search using the Tavily API.

## What is Tavily?

Tavily is a search API designed specifically for AI agents. It returns:
- Clean, structured results
- AI-friendly content formatting
- No ads or spam
- Fast response times

## Setup

Set your Tavily API key:
```bash
export TAVILY_API_KEY=tvly-xxxxx
```

## Usage

```python
import urllib.request
import json

def tavily_search(query, api_key):
    url = "https://api.tavily.com/search"
    data = json.dumps({
        "query": query,
        "search_depth": "advanced",
        "include_answer": True,
        "max_results": 5
    }).encode()
    
    req = urllib.request.Request(url, data=data, headers={
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    })
    
    response = urllib.request.urlopen(req)
    return json.loads(response.read().decode())
```

## Parameters

| Parameter | Description | Default |
|-----------|-------------|---------|
| query | Search query | Required |
| search_depth | "basic" or "advanced" | "basic" |
| include_answer | Include AI answer | false |
| max_results | Number of results | 5 |
| include_domains | Limit to domains | [] |
| exclude_domains | Exclude domains | [] |

## Best Practices

1. Use specific, descriptive queries
2. Use "advanced" depth for complex questions
3. Filter by domain when needed
4. Cache results to avoid redundant calls
