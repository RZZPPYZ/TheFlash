/**
 * Global hotkey — migrated from python-legacy/theflash/hotkey.py.
 *
 * The legacy module hand-rolled Win32 RegisterHotKey + WndProc subclassing
 * because pynput's SetWindowsHookEx can be blocked. Electron's globalShortcut
 * gives the same kernel-level behaviour portably — no ctypes, no WndProc,
 * no 64-bit callback-pointer mismatch (python-legacy/theflash/hotkey.py:281).
 */

import { globalShortcut } from 'electron'
import type { HotkeyConfig } from '../shared/types'

/** Convert {modifiers, key} → Electron accelerator "Ctrl+Shift+F". */
export function toAccelerator(hk: HotkeyConfig): string {
  return [...hk.modifiers, hk.key].join('+')
}

export function registerHotkey(hk: HotkeyConfig, callback: () => void): boolean {
  unregisterHotkey()
  const acc = toAccelerator(hk)
  const ok = globalShortcut.register(acc, callback)
  if (!ok) {
    console.error(`[hotkey] Failed to register "${acc}" — combination may be taken.`)
  }
  return ok
}

export function unregisterHotkey(): void {
  globalShortcut.unregisterAll()
}
