import type { AppConfig, SaveResult, UnsavedChoice, TodayNote, ThemeName } from '../../shared/types'

interface FlashAPI {
  saveNote: (text: string) => Promise<SaveResult | null>
  getConfig: () => Promise<AppConfig>
  unsavedDialog: () => Promise<UnsavedChoice>
  showInFolder: () => Promise<void>
  hideWindow: () => void
  onClearEditor: (cb: () => void) => () => void
  onFocusEditor: (cb: () => void) => () => void
  saveDraft: (text: string) => Promise<void>
  clearDraft: () => Promise<void>
  getTodayNoteCount: () => Promise<number>
  onRestoreDraft: (cb: (text: string) => void) => () => void
  getTodayNotes: () => Promise<TodayNote[]>
  loadNote: (filepath: string) => Promise<string>
  updateNote: (filepath: string, text: string) => Promise<SaveResult>
  deleteNote: (filepath: string) => Promise<boolean>
  setTheme: (theme: ThemeName) => Promise<void>
}

declare global {
  interface Window {
    flash: FlashAPI
  }
}

export {}
