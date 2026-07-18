"""App orchestrator — wires together config, hotkey, editor, and tray.

This is the central module that manages the full app lifecycle:
   Start → SingleInstance check → Config → Editor (hidden) → Hotkey → Idle
   Hotkey pressed → Show editor → Edit → Save/Hide → Back to Idle
   Exit via tray → Cleanup → Shutdown
"""

import tkinter as tk
import signal
import threading
from pathlib import Path
from typing import Optional

from theflash.config import Config
from theflash.hotkey import HotkeyManager
from theflash.ui.editor import EditorWindow
from theflash import single_instance


class FlashApp:
    """The Flash application orchestrator."""

    def __init__(self):
        # -- Single instance check (exits if another is running) --
        single_instance.check_and_handle()

        # -- Load configuration --
        self._config = Config()

        # -- Create invisible root window (for tkinter message loop) --
        self._root = tk.Tk()
        self._root.withdraw()  # Never show the root window
        self._root.title("The Flash")  # Used by FindWindow for single-instance
        self._root.protocol("WM_DELETE_WINDOW", self.shutdown)

        # -- Editor window (pre-created, hidden) --
        self._editor = EditorWindow(
            self._root,
            save_path=self._config.save_path,
            on_save=self._on_note_saved,
            on_hide=self._save_geometry,
            always_on_top=self._config.always_on_top,
            dark_mode=(self._config.theme == "dark"),
            geometry=self._config.get("window_geometry"),
        )

        # -- System tray icon --
        self._tray_icon = None
        self._setup_tray()

        # -- Global hotkey --
        self._hotkey_manager = HotkeyManager(
            root=self._root,
            callback=self._on_hotkey_triggered,
        )
        self._hotkey_manager.start(
            modifiers=self._config.hotkey_modifiers,
            key=self._config.hotkey_key,
        )

        # -- Graceful shutdown --
        signal.signal(signal.SIGINT, lambda s, f: self.shutdown())
        signal.signal(signal.SIGTERM, lambda s, f: self.shutdown())

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------

    def run(self):
        """Start the tkinter main loop (blocks until shutdown)."""
        self._root.mainloop()

    def shutdown(self, event=None):
        """Graceful shutdown: save geometry, unregister hotkey, remove tray, exit."""
        self._save_geometry()

        self._hotkey_manager.stop()

        if self._tray_icon:
            try:
                self._tray_icon.stop()
            except Exception:
                pass

        try:
            self._editor.destroy()
        except tk.TclError:
            pass

        try:
            self._root.destroy()
        except tk.TclError:
            pass

    # ------------------------------------------------------------------
    # Hotkey callback
    # ------------------------------------------------------------------

    def _on_hotkey_triggered(self):
        """Called when the global hotkey is pressed."""
        # Toggle: if editor is visible, hide it; otherwise show it
        try:
            if self._editor.window.state() == "normal":
                self._editor.hide()
            else:
                self._editor.show()
        except tk.TclError:
            pass

    # ------------------------------------------------------------------
    # Editor callbacks
    # ------------------------------------------------------------------

    def _on_note_saved(self, text: str):
        """Called after a note is saved successfully."""
        self._update_tray_recent_notes()

    def _save_geometry(self):
        """Persist current window geometry to config."""
        geo = self._editor.save_geometry()
        if geo:
            for k, v in geo.items():
                self._config._set_no_save(f"window_geometry.{k}", v)
            self._config.save()

    # ------------------------------------------------------------------
    # System tray
    # ------------------------------------------------------------------

    def _setup_tray(self):
        """Create the system tray icon and menu."""
        try:
            import pystray
            from PIL import Image, ImageDraw
        except ImportError:
            # pystray or pillow not available — skip tray
            return

        # Generate a simple bolt icon programmatically
        icon_image = self._generate_tray_icon()

        menu = pystray.Menu(
            pystray.MenuItem(
                "New Note",
                self._tray_new_note,
                default=True,  # double-click → new note
            ),
            pystray.MenuItem(
                "Open Notes Folder",
                self._tray_open_folder,
            ),
            pystray.Menu.SEPARATOR,
            pystray.MenuItem(
                "Exit The Flash",
                self.shutdown,
            ),
        )

        self._tray_icon = pystray.Icon(
            "TheFlash",
            icon_image,
            menu=menu,
            title="The Flash — Quick Notes",
        )

        # Run pystray in a background thread
        tray_thread = threading.Thread(
            target=self._tray_icon.run,
            daemon=True,
            name="tray-thread",
        )
        tray_thread.start()

    def _generate_tray_icon(self):
        """Generate a 32x32 bolt icon for the system tray."""
        from PIL import Image, ImageDraw

        img = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)

        # Draw a lightning bolt shape in yellow
        bolt_color = (250, 210, 50, 255)  # Golden yellow
        # Simple bolt using polygon points
        draw.polygon([
            (16, 2),   # top point
            (8, 14),   # left indent
            (14, 14),  # inner right
            (10, 30),  # bottom
            (18, 16),  # right indent
            (12, 16),  # inner left
        ], fill=bolt_color)

        return img

    def _tray_new_note(self):
        """Tray menu: show the editor for a new note."""
        # Must use root.after to cross from pystray thread → tkinter thread
        self._root.after(0, self._editor.show)

    def _tray_open_folder(self):
        """Tray menu: open the notes folder in Explorer."""
        from theflash.utils import open_in_explorer
        self._root.after(0, lambda: open_in_explorer(self._config.save_path))

    def _update_tray_recent_notes(self):
        """Refresh tray menu with recent notes (future enhancement)."""
        pass


def main():
    """Entry point for `python -m theflash`."""
    app = FlashApp()
    app.run()


if __name__ == "__main__":
    main()