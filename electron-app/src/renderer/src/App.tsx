import { useEffect, useRef, useState } from 'react'
import TitleBar from './components/TitleBar'
import Editor from './components/Editor'
import StatusBar from './components/StatusBar'
import { flash } from './lib/ipc'
import type { AppConfig } from '../../shared/types'

export default function App(): JSX.Element {
  const [text, setText] = useState('')
  const [modified, setModified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const savedFlashTimer = useRef<number | null>(null)

  // Load config once for theme; main drives the rest.
  useEffect(() => {
    flash.getConfig().then((cfg: AppConfig) => setTheme(cfg.theme))
  }, [])

  // Apply dark class to <html> for Tailwind dark: variants + CSS overrides.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Main → renderer: clear on show, focus after show.
  useEffect(() => {
    const offClear = flash.onClearEditor(() => {
      setText('')
      setModified(false)
      setSavedFlash(false)
    })
    const offFocus = flash.onFocusEditor(() => {
      // Focus on next tick so the textarea is mounted/visible.
      requestAnimationFrame(() => textareaRef.current?.focus())
    })
    return () => {
      offClear()
      offFocus()
    }
  }, [])

  function handleChange(v: string): void {
    setText(v)
    setModified(true)
  }

  async function doSave(): Promise<void> {
    if (saving) return
    if (!text.trim()) {
      // Empty note — just hide, don't write a file (parity with legacy).
      setModified(false)
      flash.hideWindow()
      return
    }
    setSaving(true)
    try {
      const result = await flash.saveNote(text)
      setModified(false)
      if (result) {
        setSavedFlash(true)
        if (savedFlashTimer.current) window.clearTimeout(savedFlashTimer.current)
        savedFlashTimer.current = window.setTimeout(() => setSavedFlash(false), 1200)
        // Brief delay so the "Saved" flash is visible before hide.
        window.setTimeout(() => flash.hideWindow(), 450)
      }
    } catch (e) {
      console.error('[save] failed:', e)
    } finally {
      setSaving(false)
    }
  }

  async function onCancel(): Promise<void> {
    await maybeConfirmUnsaved()
  }

  /** Returns true if we ended up hiding (or nothing to confirm). */
  async function maybeConfirmUnsaved(): Promise<boolean> {
    if (!modified || !text.trim()) {
      flash.hideWindow()
      return true
    }
    const choice = await flash.unsavedDialog()
    if (choice === 'save') {
      await doSave()
      return true
    }
    if (choice === 'discard') {
      setModified(false)
      flash.hideWindow()
      return true
    }
    // cancel — keep editing.
    return false
  }

  // Global key handling within the window.
  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        void doSave()
      } else if (mod && e.key === 'Enter') {
        e.preventDefault()
        void doSave()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        void onCancel()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, modified, saving])

  return (
    <div className="flex h-screen flex-col bg-base-900">
      <TitleBar modified={modified} onClose={() => void onCancel()} />
      <Editor value={text} onChange={handleChange} textareaRef={textareaRef} theme={theme} />
      <StatusBar
        text={text}
        saving={saving}
        savedFlash={savedFlash}
        theme={theme}
        onSave={() => void doSave()}
        onCancel={() => void onCancel()}
        onOpenFolder={() => void flash.showInFolder()}
      />
    </div>
  )
}
