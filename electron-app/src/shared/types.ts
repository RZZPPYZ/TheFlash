/**
 * Shared types and constants — imported by both main and renderer.
 *
 * Keeping the config.json shape identical to the legacy Python app
 * (see python-legacy/theflash/config.py) so user data migrates untouched.
 */

export interface HotkeyConfig {
  modifiers: string[] // e.g. ["Ctrl", "Shift"]
  key: string // e.g. "F"
}

export interface WindowGeometry {
  x: number | null
  y: number | null
  width: number
  height: number
}

export type ThemeName = 'dark' | 'light'

export interface AppConfig {
  version: number
  hotkey: HotkeyConfig
  save_path: string
  window_geometry: WindowGeometry
  always_on_top: boolean
  auto_save_on_close: boolean
  start_minimized_to_tray: boolean
  theme: ThemeName
}

/** Default config — deep-clone on read to avoid shared-mutable bug from python-legacy/config.py:53. */
export const DEFAULT_CONFIG: AppConfig = {
  version: 1,
  hotkey: { modifiers: ['Ctrl', 'Shift'], key: 'F' },
  save_path: '', // filled at runtime from getDefaultSavePath()
  window_geometry: { x: null, y: null, width: 520, height: 400 },
  always_on_top: true,
  auto_save_on_close: false,
  start_minimized_to_tray: true,
  theme: 'dark'
}

export type UnsavedChoice = 'save' | 'discard' | 'cancel'

/** IPC channel names — single source of truth for main/preload/renderer. */
export const IPC = {
  SAVE_NOTE: 'flash:save-note', // renderer → main: persist text, returns SaveResult|null
  GET_CONFIG: 'flash:get-config', // renderer → main: get config snapshot
  UNSAVED_DIALOG: 'flash:unsaved-dialog', // renderer → main: ask Save/Discard/Cancel
  SHOW_IN_FOLDER: 'flash:show-in-folder', // renderer → main: open notes dir
  HIDE_WINDOW: 'flash:hide-window', // renderer → main: hide editor (after save / escape)
  CLEAR_EDITOR: 'flash:clear-editor', // main → renderer: blank out textarea on show
  FOCUS_EDITOR: 'flash:focus-editor' // main → renderer: focus textarea after show
} as const

export interface SaveResult {
  path: string
}
