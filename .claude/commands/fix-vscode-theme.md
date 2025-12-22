---
description: Restore VS Code workspace theme colors when they get corrupted
---

# Fix VS Code Theme

Restores the full VS Code workspace color settings when they get accidentally reduced to just a few lines.

---

## The Problem

VS Code settings sometimes get reduced from the full theme to just:

```json
{
  "workbench.colorCustomizations": {
    "activityBar.activeBorder": "#a855f7"
  }
}
```

The color is still there, but the rest of the styling is missing.

---

## Step 1: Read Current Color

Read `.vscode/settings.json` and extract the color value from whichever property still exists (usually `activityBar.activeBorder` or `activityBar.background`).

---

## Step 2: Write Full Settings

Using the extracted color, write the complete settings:

```json
{
  "workbench.colorCustomizations": {
    "activityBar.activeBorder": "<EXTRACTED_COLOR>",
    "activityBar.activeBackground": "<EXTRACTED_COLOR>",
    "activityBar.background": "<EXTRACTED_COLOR>",
    "activityBar.foreground": "#ffffff",
    "activityBar.inactiveForeground": "#ffffffaa",
    "statusBar.background": "<EXTRACTED_COLOR>",
    "statusBar.foreground": "#ffffff",
    "titleBar.activeBackground": "<EXTRACTED_COLOR>",
    "titleBar.activeForeground": "#ffffff"
  }
}
```

---

## Step 3: Confirm

Report the color that was found and confirm the full theme was restored.
