/**
 * Main process entry — wires single-instance lock, window, tray, hotkey, IPC.
 *
 * Lifecycle mirrors python-legacy/theflash/app.py:
 *   Start → SingleInstance → Config → hidden window → Tray → global hotkey
 *   → brief show after 300ms → idle (hotkey toggles).
 */

import { app, BrowserWindow, shell } from 'electron'
import {
  createWindow,
  showWindow,
  hideWindow,
  toggleWindow,
  getWindow,
  markQuitting
} from './window'
import { createTray, destroyTray } from './tray'
import { registerHotkey, unregisterHotkey } from './hotkey'
import { registerIpc } from './ipc'
import { init, getConfig } from './state'

// ---- Single instance ----
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  // Another instance owns the lock — quit; second-instance handler on the
  // existing process will surface its window.
  app.quit()
} else {
  app.on('second-instance', () => {
    showWindow()
  })

  app.whenReady().then(bootstrap).catch((err) => {
    console.error('[boot] failed:', err)
    app.quit()
  })
}

function bootstrap(): void {
  init()
  registerIpc()
  createWindow()

  createTray({
    onNewNote: () => showWindow(),
    onOpenFolder: () => {
      void shell.openPath(getConfig().get().save_path)
    },
    onExit: () => gracefulExit()
  })

  registerHotkey(getConfig().get().hotkey, () => toggleWindow())

  // Parity: legacy briefly popped the editor after 300ms so the user sees
  // the app is running (python-legacy/theflash/app.py:67).
  setTimeout(() => showWindow(), 300)

  // macOS: re-create a window when the dock icon is clicked with none open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

function gracefulExit(): void {
  markQuitting()
  saveGeometryOnExit()
  unregisterHotkey()
  destroyTray()
  hideWindow()
  app.quit()
}

function saveGeometryOnExit(): void {
  const w = getWindow()
  if (!w) return
  const [width, height] = w.getSize()
  const [x, y] = w.getPosition()
  getConfig().setGeometry({ x, y, width, height })
}
