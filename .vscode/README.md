# VSCode Workspace Configuration

## Workspace Colors (Local Settings)

Each worktree has distinct colors to avoid confusion when working in multiple VSCode windows.

**Note:** `.vscode/settings.json` is gitignored (industry standard practice) so colors must be set manually in each worktree.

### Volunteer Worktree (Green)

```json
{
  "workbench.colorCustomizations": {
    "activityBar.activeBorder": "#22c55e",
    "activityBar.activeBackground": "#22c55e",
    "activityBar.background": "#16a34a",
    "activityBar.foreground": "#ffffff",
    "statusBar.background": "#22c55e",
    "statusBar.foreground": "#ffffff",
    "titleBar.activeBackground": "#22c55e",
    "titleBar.activeForeground": "#ffffff",
    "titleBar.inactiveBackground": "#16a34a",
    "titleBar.inactiveForeground": "#ffffff"
  }
}
```

### Prayer Worktree (Blue)

```json
{
  "workbench.colorCustomizations": {
    "activityBar.activeBorder": "#3b82f6",
    "activityBar.activeBackground": "#3b82f6",
    "activityBar.background": "#2563eb",
    "activityBar.foreground": "#ffffff",
    "statusBar.background": "#3b82f6",
    "statusBar.foreground": "#ffffff",
    "titleBar.activeBackground": "#3b82f6",
    "titleBar.activeForeground": "#ffffff",
    "titleBar.inactiveBackground": "#2563eb",
    "titleBar.inactiveForeground": "#ffffff"
  }
}
```

### Main Worktree (Red)

```json
{
  "workbench.colorCustomizations": {
    "activityBar.activeBorder": "#ef4444",
    "activityBar.activeBackground": "#ef4444",
    "activityBar.background": "#dc2626",
    "activityBar.foreground": "#ffffff",
    "statusBar.background": "#ef4444",
    "statusBar.foreground": "#ffffff",
    "titleBar.activeBackground": "#ef4444",
    "titleBar.activeForeground": "#ffffff",
    "titleBar.inactiveBackground": "#dc2626",
    "titleBar.inactiveForeground": "#ffffff"
  }
}
```

## Setup Instructions

### Option 1: Manual Copy-Paste

1. Copy the JSON config for your worktree (above)
2. Open VSCode in the worktree
3. Cmd/Ctrl + Shift + P → "Preferences: Open Workspace Settings (JSON)"
4. Paste the color configuration
5. Save and reload VSCode window

### Option 2: Use Peacock Extension (Recommended)

1. Install [Peacock extension](https://marketplace.visualstudio.com/items?itemName=johnpapa.vscode-peacock)
2. Cmd/Ctrl + Shift + P → "Peacock: Change to a Favorite Color"
3. Choose green/blue/red based on worktree
4. Peacock handles the JSON automatically

## Why Gitignored?

`.vscode/settings.json` is gitignored because:

- ✅ Zero merge conflicts between worktrees
- ✅ Personal preferences (colors, editor settings, extensions)
- ✅ API keys/secrets stored in workspace settings
- ✅ Industry standard (used by most open-source projects)

**Team-shared settings** (linting, formatting) go in dedicated config files:

- `.prettierrc` - Prettier formatting
- `eslint.config.mjs` - ESLint rules
- `tsconfig.json` - TypeScript compiler options
