/**
 * Preload — exposes a narrow, typed API to the renderer via contextBridge.
 * No Node/Electron surface leaks to the page beyond these explicit calls.
 */

import { contextBridge, ipcRenderer } from 'electron'
import {
  IPC,
  type AppConfig,
  type DraftSnapshot,
  type NoteSummary,
  type UnsavedChoice,
  type SaveResult,
  type ThemeName
} from '../shared/types'

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
  },

  // Draft management.
  saveDraft: (text: string, notePath: string | null): Promise<void> =>
    ipcRenderer.invoke(IPC.SAVE_DRAFT, text, notePath),

  clearDraft: (): Promise<void> =>
    ipcRenderer.invoke(IPC.CLEAR_DRAFT),

  getDraft: (): Promise<DraftSnapshot | null> =>
    ipcRenderer.invoke(IPC.GET_DRAFT),

  getNoteCount: (): Promise<number> =>
    ipcRenderer.invoke(IPC.GET_NOTE_COUNT),

  // All saved notes.
  getNotes: (): Promise<NoteSummary[]> =>
    ipcRenderer.invoke(IPC.GET_NOTES),

  loadNote: (filepath: string): Promise<string> =>
    ipcRenderer.invoke(IPC.LOAD_NOTE, filepath),

  updateNote: (filepath: string, text: string): Promise<SaveResult> =>
    ipcRenderer.invoke(IPC.UPDATE_NOTE, filepath, text),

  deleteNote: (filepath: string): Promise<boolean> =>
    ipcRenderer.invoke(IPC.DELETE_NOTE, filepath),

  setTheme: (theme: ThemeName): Promise<void> =>
    ipcRenderer.invoke(IPC.SET_THEME, theme)
}

export type FlashAPI = typeof flashAPI

contextBridge.exposeInMainWorld('flash', flashAPI)

// Type declaration for the renderer (consumed via lib/ipc.ts).
declare global {
  interface Window {
    flash: FlashAPI
  }
}
