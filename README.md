# ⚡ The Flash

**Lightning-fast idea capture for Windows.**

[English](README.md) | [中文](README_CN.md)

---

**Lightning-fast idea capture for Windows.** Press a global hotkey, type your thought, save, and get back to what you were doing — all in seconds.

### Features

- **Instant wake-up** — `Ctrl+Shift+F` summons the editor from any application
- **Daily draft** — unsaved text auto-persists; re-open on the same day and your draft is restored
- **All notes sidebar** — collapsible left panel lists every saved note by default; click to reload and keep editing
- **Full Markdown editor** — CodeMirror syntax highlighting and toolbar controls for H1–H6, bold, italic, underline, strikethrough, quotes, lists, tasks, links, images, code, tables, rules, and Mermaid
- **Markdown & Mermaid preview** — render GFM Markdown, flowcharts, sequence diagrams, and other Mermaid diagrams
- **In-place save** — editing a saved note keeps its file context across summon/hide and updates the original file instead of creating duplicates
- **Delete notes** — hover any sidebar item to delete
- **Merge notes** — `Ctrl+click` to multi-select sidebar notes, then `Ctrl+E` to merge them with Markdown section dividers
- **Font zoom** — `Ctrl+Scroll` to adjust editor font size (9–32px, persisted)
- **Dark / Light theme** — toggled via config
- **System tray** — minimized to tray, always one hotkey away

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Shift+F` | Toggle editor (global hotkey) |
| `Ctrl+S` | Save note (keep window open) |
| `Ctrl+Enter` | Save and close |
| `Ctrl+N` | Save current & start new note |
| `Ctrl+Shift+H` | Toggle all-notes sidebar |
| `Ctrl+Shift+P` | Switch between Markdown editing and preview |
| `Ctrl+E` | Merge selected sidebar notes |
| `Ctrl+Scroll` | Zoom editor font |
| `Escape` | Auto-save & close |

### Markdown editor and Mermaid preview

The source editor provides Markdown syntax highlighting and a full formatting toolbar. Use the code/eye controls in the title bar, or press `Ctrl+Shift+P`, to switch between source and rendered views. Mermaid diagrams use standard fenced code blocks:

````markdown
```mermaid
flowchart LR
  Idea --> Note
  Note --> Done
```
````

### Quick Start

```bash
cd electron-app
npm install
npm run dev          # launch with hot reload
```

### Build Installer

```bash
cd electron-app
npm run build:win    # produces dist/ with NSIS installer
```

### Configuration

Edit `%APPDATA%/TheFlash/config.json`:

```json
{
  "version": 1,
  "hotkey": { "modifiers": ["Ctrl", "Shift"], "key": "F" },
  "save_path": "C:\\Users\\<you>\\Documents\\TheFlash_Notes",
  "window_geometry": { "x": null, "y": null, "width": 520, "height": 400 },
  "always_on_top": false,
  "auto_save_on_close": false,
  "start_minimized_to_tray": true,
  "theme": "dark"
}
```

Notes are saved as `Documents/TheFlash_Notes/YYYY-MM-DD_HH-MM-SS.md`.

### Tech Stack

- **Electron** — main process (window, tray, global hotkey, single instance)
- **electron-vite** + **React 18** + **TypeScript**
- **CodeMirror / react-markdown-editor** — Markdown source highlighting and formatting toolbar
- **Tailwind CSS** — neutral-gray modern theme
- **electron-builder** — Windows NSIS installer

### License

MIT
