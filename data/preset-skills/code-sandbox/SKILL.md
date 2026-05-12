---
name: code-sandbox
description: Safe code execution in isolated sandbox. Use when you need to run untrusted code or test code snippets safely.
metadata: {"nanobot":{"emoji":"📦"}}
---
# Code Sandbox

Execute code safely in an isolated environment.

## Capabilities

- Run Python, JavaScript, Bash code
- Isolated execution environment
- Timeout protection
- Output capture
- Error handling

## Usage

When you need to:
- Test code snippets
- Run untrusted code
- Verify code behavior
- Debug issues
- Demonstrate examples

Use the sandbox for safe execution.

## Python Execution

```python
# Simple execution using exec tool
# Use the built-in exec tool to run Python code
print("Hello World")

# Multi-line code
import sys
print(sys.version)
```

## JavaScript Execution

```javascript
// Node.js execution
console.log("Hello from Node.js");
```

## Safety Features

1. **Timeout**: Commands timeout after 60 seconds (configured in tools.exec.timeout)
2. **Output Limit**: Output truncated to 10000 characters
3. **Sandbox**: Optional bwrap sandbox backend for isolation

## Best Practices

1. Always handle timeouts gracefully
2. Capture both stdout and stderr
3. Use appropriate language for the task
4. Clean up temporary files
