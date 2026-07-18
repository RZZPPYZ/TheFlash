"""Global hotkey manager — pynput-based listener bridged to tkinter's main loop.

Architecture:
    [Background Thread: pynput Listener]
        │
        │  on_press/on_release → track pressed_keys set
        │  When hotkey combo matches → queue.put("toggle")
        │
        ▼
    [queue.Queue]  ←── Thread-safe bridge
        │
        ▼
    [Main Thread: tkinter event loop]
        │
        │  root.after(50, _poll_queue)
        │  If "toggle" in queue → callback()
        │
        ▼
    [EditorWindow.show() or .hide()]
"""

import queue
import threading
from typing import Callable, Optional

from pynput.keyboard import Key, KeyCode, Listener


# Canonical modifier names → pynput key objects
MODIFIER_MAP: dict[str, Key | KeyCode] = {
    "Ctrl":  Key.ctrl,
    "Ctrl_L": Key.ctrl_l,
    "Ctrl_R": Key.ctrl_r,
    "Alt":   Key.alt,
    "Alt_L":  Key.alt_l,
    "Alt_R":  Key.alt_r,
    "Shift": Key.shift,
    "Shift_L": Key.shift_l,
    "Shift_R": Key.shift_r,
    "Win":   Key.cmd,
    "Win_L":  Key.cmd_l,
    "Win_R":  Key.cmd_r,
}


def _key_to_canonical(k: Key | KeyCode) -> Optional[str]:
    """Convert a pynput key to a canonical string, e.g. Key.ctrl → 'Ctrl'."""
    if k == Key.ctrl or k == Key.ctrl_l or k == Key.ctrl_r:
        return "Ctrl"
    if k == Key.alt or k == Key.alt_l or k == Key.alt_r:
        return "Alt"
    if k == Key.shift or k == Key.shift_l or k == Key.shift_r:
        return "Shift"
    if k == Key.cmd or k == Key.cmd_l or k == Key.cmd_r:
        return "Win"
    if isinstance(k, KeyCode) and k.vk is not None:
        # Printable key or special key with vk
        return k.char.upper() if k.char else f"VK_{k.vk}"
    if isinstance(k, Key):
        return k.name.upper()  # e.g. 'F1', 'ESC', 'TAB'
    return None


class HotkeyManager:
    """Listens globally for a configurable key combination and fires a callback."""

    def __init__(self, root, callback: Callable[[], None]):
        self._root = root
        self._callback = callback
        self._queue: queue.Queue = queue.Queue()
        self._listener: Optional[Listener] = None
        self._pressed: set = set()
        self._hotkey_mods: set[str] = set()
        self._hotkey_key: Optional[str] = None
        self._running = False

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start(self, modifiers: list[str], key: str):
        """Register and start listening for the hotkey combination."""
        self._hotkey_mods = set(m.lower() for m in modifiers)
        self._hotkey_key = key.lower()

        self._listener = Listener(
            on_press=self._on_press,
            on_release=self._on_release,
        )
        self._listener.start()
        self._running = True

        # Start polling the queue from tkinter's event loop
        self._poll_queue()

    def stop(self):
        """Stop the listener and clean up."""
        self._running = False
        if self._listener:
            self._listener.stop()
            self._listener = None

    def reregister(self, modifiers: list[str], key: str):
        """Change the hotkey while running."""
        self._hotkey_mods = set(m.lower() for m in modifiers)
        self._hotkey_key = key.lower()
        self._pressed.clear()

    @property
    def current_hotkey(self) -> str:
        """Return current hotkey as a human-readable string, e.g. 'Ctrl+Shift+F'."""
        mods = sorted(self._hotkey_mods)
        return "+".join(m.capitalize() for m in mods + [self._hotkey_key.upper()])

    # ------------------------------------------------------------------
    # Internal: keyboard event handling (runs on pynput thread)
    # ------------------------------------------------------------------

    def _on_press(self, key):
        canonical = _key_to_canonical(key)
        if canonical:
            self._pressed.add(canonical.lower())
            self._check_combo()

    def _on_release(self, key):
        canonical = _key_to_canonical(key)
        if canonical:
            self._pressed.discard(canonical.lower())

    def _check_combo(self):
        """Check if the required hotkey combination is currently pressed."""
        if not self._hotkey_mods or not self._hotkey_key:
            return

        # All required modifiers must be pressed
        if not self._hotkey_mods.issubset(self._pressed):
            return

        # The target key must be pressed AND the last key pressed
        if self._hotkey_key not in self._pressed:
            return

        # Prevent rapid re-trigger: clear the target key so it must be
        # released and re-pressed to fire again
        self._pressed.discard(self._hotkey_key)
        self._queue.put("toggle")

    # ------------------------------------------------------------------
    # Internal: queue polling (runs on tkinter main thread)
    # ------------------------------------------------------------------

    def _poll_queue(self):
        """Drain the queue and fire callbacks. Re-schedules itself via root.after."""
        try:
            while True:
                msg = self._queue.get_nowait()
                if msg == "toggle":
                    self._callback()
        except queue.Empty:
            pass

        if self._running:
            self._root.after(25, self._poll_queue)  # 25ms poll rate = 40Hz