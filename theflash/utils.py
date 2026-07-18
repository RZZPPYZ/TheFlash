"""Utility helpers for The Flash app."""

import os
import sys
from pathlib import Path
from datetime import datetime
from tkinter import Tk


def get_appdata_dir() -> Path:
    """Return The Flash's config directory: %APPDATA%/TheFlash."""
    appdata = os.environ.get("APPDATA", os.path.expanduser("~"))
    return Path(appdata) / "TheFlash"


def get_default_save_path() -> Path:
    """Return default notes save directory: %USERPROFILE%/Documents/TheFlash_Notes."""
    docs = os.path.join(os.environ.get("USERPROFILE", os.path.expanduser("~")), "Documents")
    return Path(docs) / "TheFlash_Notes"


def ensure_directory(path: Path) -> Path:
    """Create directory if it doesn't exist. Returns the path."""
    path.mkdir(parents=True, exist_ok=True)
    return path


def format_timestamp(dt: datetime = None) -> str:
    """Return formatted timestamp string: YYYY-MM-DD_HH-MM-SS."""
    if dt is None:
        dt = datetime.now()
    return dt.strftime("%Y-%m-%d_%H-%M-%S")


def parse_timestamp(filename: str) -> datetime | None:
    """Extract datetime from a timestamp-based filename."""
    stem = Path(filename).stem  # remove extension
    # Match YYYY-MM-DD_HH-MM-SS
    try:
        return datetime.strptime(stem[:19], "%Y-%m-%d_%H-%M-%S")
    except (ValueError, IndexError):
        return None


def get_resource_path(relative_path: str) -> Path:
    """Get absolute path to a resource (works for dev and PyInstaller)."""
    if getattr(sys, 'frozen', False):
        base = Path(sys._MEIPASS)
    else:
        base = Path(__file__).parent.parent
    return base / relative_path


def clamp_geometry(x: int, y: int, w: int, h: int, min_w: int = 300, min_h: int = 200) -> dict:
    """Clamp window geometry to screen bounds."""
    from tkinter import Tk
    root = Tk()
    root.withdraw()
    screen_w = root.winfo_screenwidth()
    screen_h = root.winfo_screenheight()
    root.destroy()

    w = max(min_w, w)
    h = max(min_h, h)
    x = max(0, min(x, screen_w - w))
    y = max(0, min(y, screen_h - h))

    return {"x": x, "y": y, "width": w, "height": h}


def get_cursor_pos():
    """Get current cursor position via Win32 API. Returns (x, y)."""
    import ctypes
    from ctypes import wintypes
    pt = wintypes.POINT()
    ctypes.windll.user32.GetCursorPos(ctypes.byref(pt))
    return pt.x, pt.y


def open_in_explorer(path: Path):
    """Open a folder in Windows Explorer."""
    os.startfile(str(path))