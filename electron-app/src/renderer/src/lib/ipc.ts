import type { AppConfig, SaveResult, UnsavedChoice, TodayNote, ThemeName } from '../../../shared/types'

const api = window.flash

export const flash = {
  saveNote: (text: string): Promise<SaveResult | null> => api.saveNote(text),
  getConfig: (): Promise<AppConfig> => api.getConfig(),
  unsavedDialog: (): Promise<UnsavedChoice> => api.unsavedDialog(),
  showInFolder: (): Promise<void> => api.showInFolder(),
  hideWindow: (): void => api.hideWindow(),
  onClearEditor: (cb: () => void): (() => void) => api.onClearEditor(cb),
  onFocusEditor: (cb: () => void): (() => void) => api.onFocusEditor(cb),
  saveDraft: (text: string): Promise<void> => api.saveDraft(text),
  clearDraft: (): Promise<void> => api.clearDraft(),
  getTodayNoteCount: (): Promise<number> => api.getTodayNoteCount(),
  onRestoreDraft: (cb: (text: string) => void): (() => void) => api.onRestoreDraft(cb),
  getTodayNotes: (): Promise<TodayNote[]> => api.getTodayNotes(),
  loadNote: (filepath: string): Promise<string> => api.loadNote(filepath),
  updateNote: (filepath: string, text: string): Promise<SaveResult> => api.updateNote(filepath, text),
  deleteNote: (filepath: string): Promise<boolean> => api.deleteNote(filepath),
  setTheme: (theme: ThemeName): Promise<void> => api.setTheme(theme)
}
