---
name: github-cli
description: GitHub CLI operations. Use when you need to manage repositories, create issues, pull requests, or interact with GitHub.
metadata: {"nanobot":{"emoji":"🐙","requires":{"bins":["gh"]}}}
---
# GitHub CLI

Interact with GitHub using the `gh` CLI tool.

## Capabilities

- Repository management
- Issue creation and management
- Pull request workflows
- GitHub Actions management
- Release management
- Gist creation

## Common Commands

```bash
# Authentication
gh auth login

# Repository
gh repo create my-repo --public
gh repo clone owner/repo
gh repo view

# Issues
gh issue create --title "Bug" --body "Description"
gh issue list --state open
gh issue close 123

# Pull Requests
gh pr create --title "Feature" --body "Description"
gh pr list
gh pr merge 456
gh pr checkout 456

# Actions
gh run list
gh run view 789

# Releases
gh release create v1.0.0 --title "Release v1.0.0"
```

## Usage Tips

1. Always check authentication status first
2. Use `--json` flag for programmatic access
3. Pipe output to `jq` for JSON processing
4. Use `--help` for detailed command info

## Integration

When the user asks to:
- Create a repository
- Submit a pull request
- Manage issues
- Check CI/CD status
- Create releases

Use the `gh` CLI to accomplish these tasks.
