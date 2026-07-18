"""Global hotkey manager — Win32 RegisterHotKey via ctypes.

Unlike pynput (which uses SetWindowsHookEx and can be blocked by
Windows security), RegisterHotKey is a kernel-level API that always works,
requires no admin rights, and handles key-repeat suppression natively.

Architecture:
    [Win32 OS] → RegisterHotKey(hwnd, id=1, mods, vk_code)
                    │
                    ▼
    [WndProc subclass] → intercepts WM_HOTKEY (0x0312)
                    │
                    ▼
    [root.after_idle(callback)] → thread-safe bridge to tkinter
                    │
                    ▼
    [EditorWindow.show() or .hide()]
"""

import ctypes
import tkinter as tk
from ctypes import wintypes, WINFUNCTYPE
from typing import Callable, Optional

# ------------------------------------------------------------------
# Win32 constants
# ------------------------------------------------------------------

WM_HOTKEY = 0x0312
GWLP_WNDPROC = -4

# Modifier flags for RegisterHotKey
MOD_ALT = 0x0001
MOD_CONTROL = 0x0002
MOD_SHIFT = 0x0004
MOD_WIN = 0x0008
MOD_NOREPEAT = 0x4000  # Suppress key-repeat so holding the keys only fires once

MODIFIER_FLAGS: dict[str, int] = {
    "Ctrl": MOD_CONTROL,
    "Alt": MOD_ALT,
    "Shift": MOD_SHIFT,
    "Win": MOD_WIN,
}


def _key_to_vk(key: str) -> int:
    """Convert a key name string to a Windows virtual-key code.

    >>> _key_to_vk('F')   → 0x46
    >>> _key_to_vk('1')    → 0x31
    >>> _key_to_vk('F12')  → 0x7B
    >>> _key_to_vk('Esc')  → 0x1B
    """
    k = key.upper()
    # Single letter A-Z
    if len(k) == 1 and "A" <= k <= "Z":
        return ord(k)
    # Single digit 0-9
    if len(k) == 1 and "0" <= k <= "9":
        return ord(k)
    # Function keys F1-F24
    if k.startswith("F"):
        try:
            n = int(k[1:])
            if 1 <= n <= 12:
                return 0x6F + n  # VK_F1 = 0x70
        except ValueError:
            pass
    # Named keys
    named: dict[str, int] = {
        "ESC": 0x1B,
        "ESCAPE": 0x1B,
        "TAB": 0x09,
        "SPACE": 0x20,
        "ENTER": 0x0D,
        "RETURN": 0x0D,
        "BACKSPACE": 0x08,
        "DELETE": 0x2E,
        "INSERT": 0x2D,
        "HOME": 0x24,
        "END": 0x23,
        "PAGEUP": 0x21,
        "PAGEDOWN": 0x22,
        "UP": 0x26,
        "DOWN": 0x28,
        "LEFT": 0x25,
        "RIGHT": 0x27,
        "PRINTSCREEN": 0x2C,
        "SCROLLLOCK": 0x91,
        "PAUSE": 0x13,
        "CAPSLOCK": 0x14,
        "NUMLOCK": 0x90,
    }
    if k in named:
        return named[k]
    raise ValueError(f"Unknown key: {key!r}")


def _parse_modifiers(modifiers: list[str]) -> int:
    """Convert a list of modifier names to a RegisterHotKey modifier mask."""
    mask = MOD_NOREPEAT
    for m in modifiers:
        flag = MODIFIER_FLAGS.get(m.capitalize())
        if flag is None:
            raise ValueError(f"Unknown modifier: {m!r}")
        mask |= flag
    return mask


# ------------------------------------------------------------------
# HotkeyManager
# ------------------------------------------------------------------


class HotkeyManager:
    """Registers a global hotkey via Win32 RegisterHotKey and fires
    a callback when the combination is pressed.  The callback is
    always invoked on the tkinter main thread via root.after_idle().
    """

    # Per-process hotkey IDs — we only ever register one (id=1).
    HOTKEY_ID = 1

    def __init__(self, root, callback: Callable[[], None]):
        self._root = root
        self._callback = callback
        self._hwnd: Optional[int] = None
        self._registered = False
        self._modifiers: list[str] = []
        self._key: str = ""

        # Prevent garbage-collection of the ctypes WNDPROC callback.
        # If Python GCs the callback, the OS calls a freed pointer → crash.
        self._wndproc_fn = None
        self._original_wndproc = None

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def start(self, modifiers: list[str], key: str):
        """Register the global hotkey and subclass the window procedure."""
        self._modifiers = list(modifiers)
        self._key = key

        # 1. Get native HWND from the tkinter root window
        self._hwnd = self._get_hwnd()
        if not self._hwnd:
            raise RuntimeError("Cannot obtain native window handle")

        # 2. Register the hotkey with the OS
        vk = _key_to_vk(key)
        mod_mask = _parse_modifiers(modifiers)

        user32 = ctypes.windll.user32
        ok = user32.RegisterHotKey(self._hwnd, self.HOTKEY_ID, mod_mask, vk)
        if not ok:
            err = ctypes.windll.kernel32.GetLastError()
            hotkey_str = self.hotkey_string
            if err == 1409:  # ERROR_HOTKEY_ALREADY_REGISTERED
                raise RuntimeError(
                    f"Hotkey {hotkey_str} is already registered "
                    f"by another application. Choose a different combination."
                )
            raise RuntimeError(
                f"RegisterHotKey failed with error {err} for {hotkey_str}"
            )

        # 3. Subclass the window procedure to catch WM_HOTKEY
        self._subclass_wndproc()

        self._registered = True

    def stop(self):
        """Unregister the hotkey and restore the original WndProc."""
        if not self._registered:
            return

        user32 = ctypes.windll.user32

        # Unregister hotkey
        if self._hwnd:
            user32.UnregisterHotKey(self._hwnd, self.HOTKEY_ID)

        # Restore original WndProc
        if self._original_wndproc is not None and self._hwnd:
            user32.SetWindowLongPtrW(
                wintypes.HWND(self._hwnd),
                GWLP_WNDPROC,
                self._original_wndproc,
            )

        self._wndproc_fn = None
        self._original_wndproc = None
        self._registered = False

    def reregister(self, modifiers: list[str], key: str):
        """Change the hotkey while running."""
        self._modifiers = list(modifiers)
        self._key = key

        if self._hwnd:
            ctypes.windll.user32.UnregisterHotKey(self._hwnd, self.HOTKEY_ID)

        vk = _key_to_vk(key)
        mod_mask = _parse_modifiers(modifiers)

        ok = ctypes.windll.user32.RegisterHotKey(
            self._hwnd, self.HOTKEY_ID, mod_mask, vk
        )
        if not ok:
            err = ctypes.windll.kernel32.GetLastError()
            raise RuntimeError(
                f"Hotkey re-registration failed with error {err}"
            )

    @property
    def hotkey_string(self) -> str:
        """Return current hotkey as 'Ctrl+Shift+F'."""
        return "+".join(self._modifiers + [self._key])

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_hwnd(self) -> Optional[int]:
        """Extract the native HWND from a tkinter root window.

        On Windows, root.frame() returns something like '0x1a0b2c'.
        We parse that hex string, then use GetAncestor(GA_ROOT) to
        get the true top-level HWND that can receive WM_HOTKEY messages.
        """
        try:
            frame_hex = self._root.frame()
            hwnd = int(frame_hex, 16)
        except (ValueError, tk.TclError):
            return None

        # GA_ROOT = 2 → get the root ancestor window
        user32 = ctypes.windll.user32
        root_hwnd = user32.GetAncestor(hwnd, 2)  # GA_ROOT
        if root_hwnd:
            return root_hwnd
        return hwnd

    def _subclass_wndproc(self):
        """Install a custom WndProc that routes WM_HOTKEY → tkinter callback."""
        user32 = ctypes.windll.user32

        # Define the callback signature
        WNDPROC_TYPE = WINFUNCTYPE(
            wintypes.LONG_PTR,
            wintypes.HWND,
            wintypes.UINT,
            wintypes.WPARAM,
            wintypes.LPARAM,
        )

        # Save the original wndproc for CallWindowProcW chaining
        orig = user32.GetWindowLongPtrW(wintypes.HWND(self._hwnd), GWLP_WNDPROC)
        self._original_wndproc = wintypes.LONG_PTR(orig)

        # The custom window procedure
        def _wndproc(hwnd, msg, wparam, lparam):
            if msg == WM_HOTKEY and wparam == self.HOTKEY_ID:
                # root.after_idle is thread-safe and runs on tkinter main thread
                try:
                    self._root.after_idle(self._callback)
                except Exception:
                    pass  # Window may have been destroyed
                return 0  # Message handled
            # Pass everything else to the original procedure
            return user32.CallWindowProcW(
                self._original_wndproc, hwnd, msg, wparam, lparam
            )

        fn = WNDPROC_TYPE(_wndproc)
        self._wndproc_fn = fn  # Prevent GC (critical!)

        user32.SetWindowLongPtrW(
            wintypes.HWND(self._hwnd),
            GWLP_WNDPROC,
            ctypes.cast(fn, wintypes.LONG_PTR),
        )