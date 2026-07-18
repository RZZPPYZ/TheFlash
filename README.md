# ⚡ The Flash

**Lightning-fast idea capture for Windows.** Press a global hotkey, type your thought, save, and get back to what you were doing — all in seconds.

## Philosophy

- **Instant** — pre-created window, hotkey summons in milliseconds
- **Minimal** — no clutter, no tabs, no formatting. Just a text box.
- **Lightweight** — ~15MB RAM, ~15MB .exe, zero bloat
- **Reliable** — plain `.md` files on disk, always accessible

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Run The Flash
python main.py
# or
python -m theflash
```

The app starts silently in the background. Press **Ctrl+Shift+F** to summon the editor.

## How It Works

1. **Press `Ctrl+Shift+F`** (default hotkey, customizable) — editor pops up instantly, centered on your cursor
2. **Type your thought** — plain text, markdown-friendly
3. **`Ctrl+S` or `Ctrl+Enter`** — saves and hides the window
4. **`Escape`** — hides the window (prompts to save if you have unsaved text)
5. Your note is saved to `Documents/TheFlash_Notes/YYYY-MM-DD_HH-MM-SS.md`

## Features

- 🌐 **Global hotkey** — works from any application
- 📝 **Markdown notes** — saved as `.md` files, readable by any editor
- 🖥️ **System tray** — lives quietly in your taskbar
- 🎨 **Dark theme** — easy on the eyes
- 📌 **Always on top** — never lose the editor behind other windows
- 🔒 **Single instance** — second launch brings the existing window forward
- ⚙️ **Customizable** — change hotkey, save path, and more via `config/settings.json`

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Shift+F` | Toggle editor (global, customizable) |
| `Ctrl+S` | Save and hide |
| `Ctrl+Enter` | Save and hide |
| `Escape` | Hide (prompt if unsaved) |
| `Ctrl+A` | Select all |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |

## Configuration

Edit `%APPDATA%/TheFlash/config.json`:

```json
{
  "hotkey": {
    "modifiers": ["Ctrl", "Shift"],
    "key": "F"
  },
  "save_path": "C:\\Users\\...\\Documents\\TheFlash_Notes",
  "always_on_top": true,
  "auto_save_on_close": false,
  "theme": "dark"
}
```

## Build Standalone .exe

```bash
pip install pyinstaller
pyinstaller --windowed --onedir --name TheFlash --icon=assets/icon.ico main.py
```

## Tech Stack

- **Python 3.13** + **tkinter** (built-in) — zero UI dependencies
- **pynput** — global keyboard hook
- **pystray** + **Pillow** — system tray icon

## License

MIT