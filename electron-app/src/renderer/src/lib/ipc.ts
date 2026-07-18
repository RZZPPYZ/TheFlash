import type { AppConfig, SaveResult, UnsavedChoice } from '../../../shared/types'

const api = window.flash

export const flash = {
  saveNote: (text: string): Promise<SaveResult | null> => api.saveNote(text),
  getConfig: (): Promise<AppConfig> => api.getConfig(),
  unsavedDialog: (): Promise<UnsavedChoice> => api.unsavedDialog(),
  showInFolder: (): Promise<void> => api.showInFolder(),
  hideWindow: (): void => api.hideWindow(),
  onClearEditor: (cb: () => void): (() => void) => api.onClearEditor(cb),
  onFocusEditor: (cb: () => void): (() => void) => api.onFocusEditor(cb)
}
