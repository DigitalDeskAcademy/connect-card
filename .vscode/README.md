# VS Code Workspace Settings

## Overview

This project uses **workspace-specific VS Code settings** to protect API keys and enable personalized configurations.

## Files

- **`settings.json`** - Your personal settings (git-ignored, not committed)
- **`settings.template.json`** - Team template (committed to git, shows recommended settings)
- **`README.md`** - This documentation

## Setup Instructions

### For New Developers

1. Copy the template file:
   ```bash
   cp .vscode/settings.template.json .vscode/settings.json
   ```

2. Add your personal settings to `.vscode/settings.json`:
   - Peacock colors (for worktree identification)
   - MCP server configurations with API keys
   - Any personal preferences

3. **Never commit `settings.json`** - it's already in `.gitignore`

### For Worktree Users

Each worktree should have its own `.vscode/settings.json` with unique Peacock colors:

- **Backend worktree**: Red (`#ff0000`)
- **Frontend worktree**: Green (`#42b883`)
- **Main worktree**: Blue (`#007acc`)

This color coding prevents accidentally working in the wrong worktree.

## Why This Approach?

**Problem**: Committing `settings.json` to git causes two issues:
1. **Security**: API keys get exposed in git history
2. **Conflicts**: Personal settings (like Peacock colors) get overwritten when switching branches

**Solution**: Keep `settings.json` local and git-ignored, use `settings.template.json` for team standards.

## What Goes Where?

### settings.template.json (Committed)
- Editor formatting rules
- ESLint configuration
- Prettier settings
- TypeScript preferences
- **No API keys**
- **No Peacock colors**

### settings.json (Local Only)
- Everything from template
- **Plus**: Your API keys (MCP, Context7, etc.)
- **Plus**: Peacock color for this worktree
- **Plus**: Any personal preferences

## Example Personal Settings

Add these to your `settings.json`:

```json
{
  // ... all settings from template ...

  // Peacock color (choose based on worktree)
  "peacock.color": "#ff0000",
  "peacock.remoteColor": "#ff0000",

  // MCP servers with API keys
  "mcp": {
    "servers": {
      "context7": {
        "type": "stdio",
        "command": "npx",
        "args": ["-y", "@upstash/context7-mcp"],
        "env": {
          "CONTEXT7_API_KEY": "your-key-here"
        }
      }
    }
  }
}
```

## Troubleshooting

### Lost Peacock Colors After Branch Switch?
This is normal! Since `settings.json` is git-ignored, it won't change when you switch branches. Your colors should persist.

If they disappear, re-add them to `settings.json` in that worktree.

### API Keys Not Working?
Make sure your API keys are in `settings.json` (not `settings.template.json`). The template file doesn't contain real API keys.

### Settings Keep Getting Overwritten?
Check that `.vscode/settings.json` is in `.gitignore`. Run:
```bash
git check-ignore .vscode/settings.json
# Should output: .vscode/settings.json
```

If it's not ignored, it's being committed to git and will get overwritten.

## Security Note

**Never commit API keys to git!**

If you accidentally committed `settings.json` with API keys:
1. Rotate all exposed API keys immediately
2. Remove the file from git history
3. Verify `.vscode/settings.json` is in `.gitignore`
