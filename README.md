# ⚡ The Flash

**Lightning-fast idea capture for Windows.** Press a global hotkey, type your thought, save, and get back to what you were doing — all in seconds.

This repository contains **two editions** of the same app:

| Edition | Path | Stack | Status |
|---------|------|-------|--------|
| **Electron** (current) | [`electron-app/`](electron-app) | Electron + React + TypeScript + Tailwind | v0.2.0 — actively developed |
| **Python** (legacy) | [`python-legacy/`](python-legacy) | Python + tkinter + Win32 | v0.1.0 — archived, still runs |

Both editions share the **same user data** — `%APPDATA%/TheFlash/config.json` and `Documents/TheFlash_Notes/*.md` — so notes and settings move freely between them.

---

## Why two editions?

The Python/tkinter edition works but tkinter's look-and-feel is the bottleneck. The Electron edition keeps identical core behaviour (instant capture, plain `.md` notes, system tray, single instance, global hotkey) while giving the UI a modern neutral-gray redesign and fixing several bugs that were inherent to the tkinter/Win32 mixing (see `python-legacy/` for the original code).

The Python source is kept for reference and as a fallback; nothing was deleted.

---

## Quick start (Electron edition)

```bash
cd electron-app
npm install
npm run dev      # launch with hot reload
```

The app starts and briefly shows the editor. Press **Ctrl+Shift+F** (default hotkey, customizable) to summon it from any application.

### Keyboard shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Shift+F` | Toggle editor (global, customizable) |
| `Ctrl+S` / `Ctrl+Enter` | Save and hide |
| `Escape` | Hide (prompts if unsaved) |
| `Ctrl+A` / `Ctrl+Z` / `Ctrl+Y` | Select all / undo / redo (native) |

### Build an installer

```bash
cd electron-app
npm run build:win   # produces dist/ with an NSIS installer
```

---

## Quick start (Python legacy edition)

```bash
cd python-legacy
pip install -r requirements.txt
python main.py
```

See [`python-legacy/README.md`](python-legacy/README.md) for the original documentation.

---

## Configuration

Edit `%APPDATA%/TheFlash/config.json` (shared by both editions):

```json
{
  "version": 1,
  "hotkey": { "modifiers": ["Ctrl", "Shift"], "key": "F" },
  "save_path": "C:\\Users\\<you>\\Documents\\TheFlash_Notes",
  "window_geometry": { "x": null, "y": null, "width": 520, "height": 400 },
  "always_on_top": true,
  "auto_save_on_close": false,
  "start_minimized_to_tray": true,
  "theme": "dark"
}
```

Notes are saved as `Documents/TheFlash_Notes/YYYY-MM-DD_HH-MM-SS.md`.

---

## Tech stack (Electron edition)

- **Electron** — main process (window, tray, global hotkey, single instance)
- **electron-vite** + **React 18** + **TypeScript**
- **Tailwind CSS** — neutral-gray modern theme
- **electron-builder** — Windows NSIS installer

## License

MIT
