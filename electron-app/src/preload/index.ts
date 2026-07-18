/**
 * Preload — exposes a narrow, typed API to the renderer via contextBridge.
 * No Node/Electron surface leaks to the page beyond these explicit calls.
 */

import { contextBridge, ipcRenderer } from 'electron'
import { IPC, type AppConfig, type UnsavedChoice, type SaveResult } from '../shared/types'

const flashAPI = {
  saveNote: (text: string): Promise<SaveResult | null> =>
    ipcRenderer.invoke(IPC.SAVE_NOTE, text),

  getConfig: (): Promise<AppConfig> => ipcRenderer.invoke(IPC.GET_CONFIG),

  unsavedDialog: (): Promise<UnsavedChoice> => ipcRenderer.invoke(IPC.UNSAVED_DIALOG),

  showInFolder: (): Promise<void> => ipcRenderer.invoke(IPC.SHOW_IN_FOLDER),

  hideWindow: (): void => {
    ipcRenderer.send(IPC.HIDE_WINDOW)
  },

  // Main → renderer events.
  onClearEditor: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on(IPC.CLEAR_EDITOR, listener)
    return () => ipcRenderer.removeListener(IPC.CLEAR_EDITOR, listener)
  },

  onFocusEditor: (cb: () => void): (() => void) => {
    const listener = (): void => cb()
    ipcRenderer.on(IPC.FOCUS_EDITOR, listener)
    return () => ipcRenderer.removeListener(IPC.FOCUS_EDITOR, listener)
  }
}

export type FlashAPI = typeof flashAPI

contextBridge.exposeInMainWorld('flash', flashAPI)

// Type declaration for the renderer (consumed via lib/ipc.ts).
declare global {
  interface Window {
    flash: FlashAPI
  }
}
