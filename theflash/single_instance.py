"""Single-instance enforcement via Win32 named mutex.

On second launch, signals the existing instance to show its window, then exits.
"""

import ctypes
from ctypes import wintypes
import sys
import os

# Win32 constants
CREATE_MUTEX = 0x8000000
ERROR_ALREADY_EXISTS = 183
ERROR_ACCESS_DENIED = 5

# Unique mutex name (per-user to allow different Windows sessions)
MUTEX_NAME = "Local\\TheFlash_SingleInstance_v1"


def check_and_handle() -> bool:
    """Check for an existing instance.

    If another instance is running:
      - Brings its window to the foreground via FindWindow
      - Exits this process

    Returns True if this is the first instance (proceed with startup).
    Returns False / exits if a second instance.
    """
    user32 = ctypes.windll.user32
    kernel32 = ctypes.windll.kernel32

    # Try to create the mutex
    handle = kernel32.CreateMutexW(None, True, MUTEX_NAME)
    error = kernel32.GetLastError()

    if error == ERROR_ALREADY_EXISTS:
        # Another instance is running — signal it and exit
        _signal_existing_instance(user32)
        kernel32.CloseHandle(handle)
        sys.exit(0)

    if error == ERROR_ACCESS_DENIED:
        # Another user owns the global mutex — try per-user
        # (this shouldn't happen with Local\ prefix but be safe)
        sys.exit(0)

    # We own the mutex. Register cleanup on exit.
    import atexit
    atexit.register(_cleanup_mutex, handle)
    return True


def _signal_existing_instance(user32):
    """Find the existing The Flash window and bring it to the foreground."""
    hwnd = user32.FindWindowW(None, "The Flash")
    if hwnd:
        # Bring to foreground
        user32.ShowWindow(hwnd, 9)  # SW_RESTORE
        user32.SetForegroundWindow(hwnd)


def _cleanup_mutex(handle):
    """Release the mutex on process exit."""
    kernel32 = ctypes.windll.kernel32
    if handle:
        kernel32.ReleaseMutex(handle)
        kernel32.CloseHandle(handle)