---
name: filesystem
description: Advanced file system operations. Use when you need to perform complex file operations, search files, or manage directories.
metadata: {"nanobot":{"emoji":"📁"}}
---
# Filesystem

Advanced file system operations and management.

## Capabilities

- File reading and writing
- Directory operations
- File search (glob, grep)
- File metadata
- Path manipulation
- File watching

## Common Operations

### Read Files

```python
# Read entire file
with open('/path/to/file', 'r') as f:
    content = f.read()

# Read line by line
with open('/path/to/file', 'r') as f:
    for line in f:
        print(line.strip())
```

### Write Files

```python
# Write content
with open('/path/to/file', 'w') as f:
    f.write("Hello World")

# Append content
with open('/path/to/file', 'a') as f:
    f.write("\nNew line")
```

### Directory Operations

```bash
# List files
ls -la /path/to/dir

# Create directory
mkdir -p /path/to/dir

# Remove directory
rm -rf /path/to/dir

# Find files
find /path -name "*.py" -type f
```

### Search Files

```bash
# Search by pattern
grep -r "pattern" /path/to/search

# Search by name
find . -name "*.txt"

# Search by content
rg "pattern" --type py
```

## Best Practices

1. Always use absolute paths for reliability
2. Handle file not found errors
3. Use context managers for file operations
4. Check file permissions before operations
5. Backup important files before modification
