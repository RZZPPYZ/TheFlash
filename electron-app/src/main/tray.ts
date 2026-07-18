/**
 * System tray — migrated from python-legacy/theflash/app.py (_setup_tray).
 * Menu: New Note (default/double-click) · Open Notes Folder · Exit.
 */

import { Tray, Menu, nativeImage } from 'electron'
import type { NativeImage } from 'electron'
import { join } from 'path'

let tray: Tray | null = null

/** Build a small amber lightning-bolt 32x32 icon programmatically. */
function buildIcon(): NativeImage {
  const img = nativeImage.createEmpty()
  return img // placeholder; replaced by resources/icon.png when packaged
}

export function createTray(handlers: {
  onNewNote: () => void
  onOpenFolder: () => void
  onExit: () => void
}): Tray {
  // Prefer a bundled PNG so the bolt actually renders.
  let icon: NativeImage
  try {
    icon = nativeImage.createFromPath(join(__dirname, '../../resources/icon.png'))
    if (icon.isEmpty()) icon = buildIcon()
  } catch {
    icon = buildIcon()
  }

  tray = new Tray(icon)
  tray.setToolTip('The Flash — Quick Notes')

  const menu = Menu.buildFromTemplate([
    { label: 'New Note', click: handlers.onNewNote },
    { label: 'Open Notes Folder', click: handlers.onOpenFolder },
    { type: 'separator' },
    { label: 'Exit The Flash', click: handlers.onExit }
  ])

  tray.setContextMenu(menu)
  tray.on('click', handlers.onNewNote) // single-click → new note (parity: legacy used double-click as default)
  tray.on('double-click', handlers.onNewNote)

  return tray
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
