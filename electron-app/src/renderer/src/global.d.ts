import type { AppConfig, SaveResult, UnsavedChoice } from '../../shared/types'

interface FlashAPI {
  saveNote: (text: string) => Promise<SaveResult | null>
  getConfig: () => Promise<AppConfig>
  unsavedDialog: () => Promise<UnsavedChoice>
  showInFolder: () => Promise<void>
  hideWindow: () => void
  onClearEditor: (cb: () => void) => () => void
  onFocusEditor: (cb: () => void) => () => void
}

declare global {
  interface Window {
    flash: FlashAPI
  }
}

export {}
