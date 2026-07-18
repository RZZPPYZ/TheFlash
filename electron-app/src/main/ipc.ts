/**
 * IPC handlers — bridging renderer requests to main-process logic.
 * All channels are listed in shared/types.ts (IPC constant) and exposed
 * to the page only through the preload contextBridge.
 *
 * Design: the renderer drives the save+flash+hide flow (it owns textarea
 * state and the "✓ Saved" label). Main only exposes atomic operations:
 * save the text, ask the unsaved dialog, open the folder, hide the window.
 */

import { ipcMain, dialog, shell, BrowserWindow } from 'electron'
import { getConfig, getNoteManager, getDraftManager } from './state'
import { IPC, type UnsavedChoice, type SaveResult } from '../shared/types'
import { hideWindow, saveGeometry } from './window'

export function registerIpc(): void {
  ipcMain.handle(IPC.SAVE_NOTE, async (_e, text: string): Promise<SaveResult | null> => {
    if (!text || !text.trim()) return null
    const nm = getNoteManager()
    return nm.save(text)
  })

  ipcMain.handle(IPC.GET_CONFIG, () => {
    return getConfig().snapshot()
  })

  ipcMain.handle(IPC.UNSAVED_DIALOG, async (e): Promise<UnsavedChoice> => {
    const win = BrowserWindow.fromWebContents(e.sender)
    const choice = await (win
      ? dialog.showMessageBox(win, {
          type: 'warning',
          title: 'Unsaved changes',
          message: 'You have unsaved changes.',
          detail: 'Yes = Save now\nNo = Discard changes\nCancel = Keep editing',
          buttons: ['Save', 'Discard', 'Cancel'],
          defaultId: 0,
          cancelId: 2,
          noLink: true
        })
      : dialog.showMessageBox({
          type: 'warning',
          title: 'Unsaved changes',
          message: 'You have unsaved changes.',
          detail: 'Yes = Save now\nNo = Discard changes\nCancel = Keep editing',
          buttons: ['Save', 'Discard', 'Cancel'],
          defaultId: 0,
          cancelId: 2,
          noLink: true
        }))
    return (['save', 'discard', 'cancel'] as const)[choice.response]
  })

  ipcMain.handle(IPC.SHOW_IN_FOLDER, async () => {
    await shell.openPath(getConfig().get().save_path)
  })

  // Renderer signals "hide now" (after a completed save, or after discard/escape).
  ipcMain.on(IPC.HIDE_WINDOW, () => {
    saveGeometry()
    hideWindow()
  })

  ipcMain.handle(IPC.SAVE_DRAFT, async (_e, text: string): Promise<void> => {
    getDraftManager().save(text)
  })

  ipcMain.handle(IPC.CLEAR_DRAFT, async (): Promise<void> => {
    getDraftManager().clear()
  })

  ipcMain.handle(IPC.GET_TODAY_NOTE_COUNT, async (): Promise<number> => {
    return getNoteManager().getTodayCount()
  })

  ipcMain.handle(IPC.GET_TODAY_NOTES, async () => {
    return getNoteManager().getTodayNotes()
  })

  ipcMain.handle(IPC.LOAD_NOTE, async (_e, filepath: string): Promise<string> => {
    return getNoteManager().load(filepath)
  })

  ipcMain.handle(IPC.UPDATE_NOTE, async (_e, filepath: string, text: string): Promise<SaveResult> => {
    return getNoteManager().update(filepath, text)
  })

  ipcMain.handle(IPC.DELETE_NOTE, async (_e, filepath: string): Promise<boolean> => {
    return getNoteManager().delete(filepath)
  })
}
