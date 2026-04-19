# Prompt Vault 

<img src="/../main/pv-logo.PNG" width="300">

A simple Chrome extension for storing, organizing, and reusing text prompts. Save prompts with titles and tags, then copy them to your clipboard in one click. Supports `#variable#` placeholders that get filled in via a modal before copying.

## Features

- **Save & organize prompts** with titles and comma-separated tags
- **Fuzzy search** across prompt titles, bodies, and tags (powered by Fuse.js)
- **Tag filtering** to browse prompts by category
- **Variable substitution** — use `#variableName#` in any prompt and fill values in at copy time
- **Right-click to save** — select text on any webpage and save it as a new prompt via the context menu
- **Import / Export** — back up and restore your prompts as a JSON file

## Usage

1. Click the extension icon to open the popup.
2. Click **New** to create a prompt. Give it a title, body, and optional tags.
3. Click any prompt card to copy it. If it contains `#variables#`, a modal will ask you to fill them in first.
4. Use the search bar or tag dropdown to filter your prompts.
5. Right-click any selected text on a page and choose **"Save as Prompt"** to pre-fill the form.

<img src="/../main/prompt-vault-overview.png" width="500">

### Variable syntax

Wrap placeholder names in `#` signs inside a prompt body:

<img src="/../main/prompt-vault-create-new.png" width="500">

For example when you click this prompt, you'll be asked to fill in the variables `broad_topic`, `target_group`, `country`, and `language` before the final prompt is copied.

<img src="/../main/prompt-vault-fill-variables.png" width="500">

## Project structure

```
prompt-vault/
├── manifest.json       # Extension config (Manifest V3)
├── background.js       # Service worker: registers the right-click context menu
├── popup.html          # Popup shell: main list, form, and variable modal views
├── popup.js            # All UI logic: CRUD, search, filtering, import/export, variables
├── popup.css           # Popup styles
├── lib/
│   └── fuse.min.js     # Bundled Fuse.js for client-side fuzzy search
└── icons/              # Required icon sizes for the Chrome Webstore
    ├── icon16.png
    ├── icon32.png
    ├── icon48.png
    └── icon128.png
```

## Installation

Since this extension is not published on the Chrome Web Store (yet), install it in developer mode:

1. Clone or download this repository.
2. Open Chrome and go to `chrome://extensions`.
3. Enable **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the project folder.

## Permissions

| Permission | Reason |
|---|---|
| `storage` | Persists prompts in `chrome.storage.local` |
| `downloads` | Enables the JSON export feature |
| `contextMenus` | Adds the "Save as Prompt" right-click option |
| `host_permissions: <all_urls>` | Allows the context menu to appear on any page |
