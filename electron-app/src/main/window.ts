/**
 * Window lifecycle — migrated from python-legacy/theflash/ui/editor.py.
 *
 * The BrowserWindow is created ONCE at startup (kept hidden) and shown/hidden
 * on demand — same "pre-created for instant wake-up" design as the legacy
 * Toplevel.
 *
 * Fix vs legacy: visibility is decided with BrowserWindow.isVisible() instead
 * of Tk's window.state()=="normal", which broke on maximize/iconic
 * (python-legacy/theflash/ui/editor.py:284).
 */

import { BrowserWindow, screen, shell } from 'electron'
import { join } from 'path'
import { getConfig } from './state'
import { IPC, type WindowGeometry } from '../shared/types'

const MIN_WIDTH = 300
const MIN_HEIGHT = 180

let win: BrowserWindow | null = null
let isQuitting = false

/** Called by the exit path so the 'close' handler stops hiding and lets go. */
export function markQuitting(): void {
  isQuitting = true
}

export function createWindow(): BrowserWindow {
  const geo = getConfig().get().window_geometry
  const dark = getConfig().get().theme === 'dark'

  win = new BrowserWindow({
    width: geo.width,
    height: geo.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    frame: false,
    transparent: false,
    resizable: true,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: getConfig().get().always_on_top,
    backgroundColor: dark ? '#0f0f10' : '#fafafa',
    title: 'The Flash', // also used for single-instance FindWindow parity
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Position if we previously saved coordinates.
  if (geo.x != null && geo.y != null) {
    win.setPosition(geo.x, geo.y, false)
  }

  // Forward clicked links to the system browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  // Clicking the custom title-bar ✕ sends a close request. Hide instead of
  // quitting so the app keeps living in the tray (parity with legacy WM_DELETE).
  win.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault()
      hideWindow()
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    void win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return win
}

export function getWindow(): BrowserWindow | null {
  return win
}

/** Toggle visibility — used by the global hotkey. */
export function toggleWindow(): void {
  if (!win) return
  if (win.isVisible() && win.isFocused()) {
    hideWindow()
  } else {
    showWindow()
  }
}

/** Show the editor: clear content, position near cursor, focus. */
export function showWindow(): void {
  if (!win) return

  // Clear previous content in the renderer.
  win.webContents.send(IPC.CLEAR_EDITOR)

  positionNearCursor()

  if (win.isMinimized()) win.restore()
  win.show()
  win.focus()
  // Tell renderer to autofocus the textarea now that the window is up.
  win.webContents.send(IPC.FOCUS_EDITOR)
}

/** Hide the editor window (does not ask about unsaved — caller decides). */
export function hideWindow(): void {
  if (!win) return
  win.hide()
}

/** Position the window centered on the cursor, clamped to the screen. */
function positionNearCursor(): void {
  if (!win) return
  const [w, h] = win.getSize()
  const point = screen.getCursorScreenPoint()
  const display = screen.getDisplayNearestPoint(point)
  const b = display.workArea

  let x = point.x - Math.floor(w / 2)
  let y = point.y - 40 // slightly above cursor (parity with legacy)
  x = Math.max(b.x, Math.min(x, b.x + b.width - w))
  y = Math.max(b.y, Math.min(y, b.y + b.height - h))

  win.setPosition(x, y, false)
}

/** Persist current geometry back to config (called on save / on hide / on exit). */
export function saveGeometry(): void {
  if (!win) return
  const [width, height] = win.getSize()
  const [x, y] = win.getPosition()
  const geo: WindowGeometry = { x, y, width, height }
  getConfig().setGeometry(geo)
}
