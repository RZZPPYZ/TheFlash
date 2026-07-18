import type { AppConfig, SaveResult, UnsavedChoice, TodayNote } from '../../shared/types'

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
}

declare global {
  interface Window {
    flash: FlashAPI
  }
}

export {}
