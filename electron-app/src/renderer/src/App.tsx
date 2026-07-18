import { useEffect, useRef, useState } from 'react'
import TitleBar from './components/TitleBar'
import Editor from './components/Editor'
import StatusBar from './components/StatusBar'
import NoteSidebar from './components/NoteSidebar'
import { flash } from './lib/ipc'
import type { AppConfig, TodayNote, ThemeName } from '../../shared/types'

export default function App(): JSX.Element {
  const [text, setText] = useState('')
  const [modified, setModified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isDraft, setIsDraft] = useState(false)
  const [todayCount, setTodayCount] = useState(0)
  const [todayNotes, setTodayNotes] = useState<TodayNote[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentNotePath, setCurrentNotePath] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('theflash-fontsize')
    return saved ? parseInt(saved, 10) : 13
  })
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const savedFlashTimer = useRef<number | null>(null)
  const draftTimerRef = useRef<number | null>(null)

  useEffect(() => {
    flash.getConfig().then((cfg: AppConfig) => setTheme(cfg.theme))
  }, [])

  useEffect(() => {
    flash.getTodayNoteCount().then((n: number) => setTodayCount(n))
  }, [])

  function refreshTodayInfo(): void {
    flash.getTodayNoteCount().then((n: number) => setTodayCount(n))
    flash.getTodayNotes().then((n: TodayNote[]) => setTodayNotes(n))
  }

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const offClear = flash.onClearEditor(() => {
      setText('')
      setModified(false)
      setIsDraft(false)
      setSavedFlash(false)
      setCurrentNotePath(null)
      refreshTodayInfo()
    })
    const offRestore = flash.onRestoreDraft((draftText: string) => {
      setText(draftText)
      setModified(true)
      setIsDraft(true)
      setSavedFlash(false)
      setCurrentNotePath(null)
      refreshTodayInfo()
    })
    const offFocus = flash.onFocusEditor(() => {
      requestAnimationFrame(() => textareaRef.current?.focus())
    })
    return () => {
      offClear()
      offRestore()
      offFocus()
    }
  }, [])

  useEffect(() => {
    if (todayNotes.length > 0 && !isDraft) {
      setSidebarOpen(true)
    }
  }, [todayNotes, isDraft])

  // Ctrl+scroll to zoom font size.
  useEffect(() => {
    function onWheel(e: WheelEvent): void {
      if (!(e.ctrlKey || e.metaKey)) return
      e.preventDefault()
      setFontSize((prev) => {
        const next = e.deltaY < 0 ? prev + 1 : prev - 1
        const clamped = Math.max(9, Math.min(32, next))
        localStorage.setItem('theflash-fontsize', String(clamped))
        return clamped
      })
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel)
  }, [])

  function handleChange(v: string): void {
    setText(v)
    setModified(true)
    setIsDraft(false)
    if (draftTimerRef.current) window.clearTimeout(draftTimerRef.current)
    draftTimerRef.current = window.setTimeout(() => {
      if (v.trim()) {
        void flash.saveDraft(v)
      } else {
        void flash.clearDraft()
      }
    }, 1500)
  }

  /** Save: update existing note in-place, or create new if none tracked. */
  async function doSaveKeep(): Promise<void> {
    if (saving) return
    if (!text.trim()) return
    setSaving(true)
    try {
      let result
      if (currentNotePath) {
        result = await flash.updateNote(currentNotePath, text)
      } else {
        result = await flash.saveNote(text)
        if (result) setCurrentNotePath(result.path)
      }
      setModified(false)
      setIsDraft(false)
      void flash.clearDraft()
      refreshTodayInfo()
      if (result) {
        setSavedFlash(true)
        if (savedFlashTimer.current) window.clearTimeout(savedFlashTimer.current)
        savedFlashTimer.current = window.setTimeout(() => setSavedFlash(false), 1200)
      }
    } catch (e) {
      console.error('[save] failed:', e)
    } finally {
      setSaving(false)
    }
  }

  /** Save note and close window. */
  async function doSaveAndClose(): Promise<void> {
    if (saving) return
    if (!text.trim()) {
      setModified(false)
      void flash.clearDraft()
      flash.hideWindow()
      return
    }
    setSaving(true)
    try {
      let result
      if (currentNotePath) {
        result = await flash.updateNote(currentNotePath, text)
      } else {
        result = await flash.saveNote(text)
        if (result) setCurrentNotePath(result.path)
      }
      setModified(false)
      setIsDraft(false)
      void flash.clearDraft()
      refreshTodayInfo()
      if (result) {
        setSavedFlash(true)
        if (savedFlashTimer.current) window.clearTimeout(savedFlashTimer.current)
        savedFlashTimer.current = window.setTimeout(() => setSavedFlash(false), 1200)
        window.setTimeout(() => flash.hideWindow(), 450)
      }
    } catch (e) {
      console.error('[save-close] failed:', e)
    } finally {
      setSaving(false)
    }
  }

  async function doNew(): Promise<void> {
    if (saving) return
    if (text.trim()) {
      setSaving(true)
      try {
        if (currentNotePath) {
          await flash.updateNote(currentNotePath, text)
        } else {
          await flash.saveNote(text)
        }
      } catch (e) {
        console.error('[new-save] failed:', e)
      } finally {
        setSaving(false)
      }
    }
    void flash.clearDraft()
    setText('')
    setModified(false)
    setIsDraft(false)
    setSavedFlash(false)
    setCurrentNotePath(null)
    refreshTodayInfo()
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  /** Close flow: auto-save if modified & non-empty, then hide. */
  async function handleClose(): Promise<boolean> {
    if (modified && text.trim()) {
      setSaving(true)
      try {
        if (currentNotePath) {
          await flash.updateNote(currentNotePath, text)
        } else {
          const result = await flash.saveNote(text)
          if (result) setCurrentNotePath(result.path)
        }
        void flash.clearDraft()
      } catch (e) {
        console.error('[auto-save] failed:', e)
      } finally {
        setSaving(false)
      }
      setModified(false)
      setIsDraft(false)
    }
    flash.hideWindow()
    return true
  }

  function toggleSidebar(): void {
    if (!sidebarOpen) {
      flash.getTodayNotes().then((n: TodayNote[]) => setTodayNotes(n))
    }
    setSidebarOpen((v) => !v)
  }

  function toggleTheme(): void {
    const next: ThemeName = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    void flash.setTheme(next)
  }

  function handleSelectNote(note: TodayNote, content: string): void {
    setText(content)
    setModified(false)
    setIsDraft(false)
    setCurrentNotePath(note.path)
    requestAnimationFrame(() => textareaRef.current?.focus())
  }

  async function handleDeleteNote(filepath: string): Promise<void> {
    try {
      await flash.deleteNote(filepath)
      if (currentNotePath === filepath) {
        setText('')
        setModified(false)
        setCurrentNotePath(null)
      }
      setSelectedPaths((prev) => {
        const next = new Set(prev)
        next.delete(filepath)
        return next
      })
      refreshTodayInfo()
    } catch (e) {
      console.error('[delete] failed:', e)
    }
  }

  async function handleMergeNotes(notes: TodayNote[]): Promise<void> {
    if (notes.length < 2) return
    try {
      const contents = await Promise.all(
        notes.map((n) => flash.loadNote(n.path))
      )
      const merged = contents.join(' ')
      // Save merged content as a new note.
      const result = await flash.saveNote(merged)
      // Delete the original notes.
      await Promise.all(notes.map((n) => flash.deleteNote(n.path)))
      // Load the merged note into the editor.
      if (result) {
        setText(merged)
        setModified(false)
        setCurrentNotePath(result.path)
        setIsDraft(false)
      }
      setSelectedPaths(new Set())
      refreshTodayInfo()
      requestAnimationFrame(() => textareaRef.current?.focus())
    } catch (e) {
      console.error('[merge] failed:', e)
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent): void {
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        void doSaveKeep()
      } else if (mod && e.key === 'Enter') {
        e.preventDefault()
        void doSaveAndClose()
      } else if (mod && (e.key === 'n' || e.key === 'N')) {
        e.preventDefault()
        void doNew()
      } else if (mod && (e.key === 'e' || e.key === 'E')) {
        e.preventDefault()
        if (selectedPaths.size >= 2) {
          const selected = todayNotes.filter((n) => selectedPaths.has(n.path))
          void handleMergeNotes(selected)
        }
      } else if (mod && e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault()
        toggleSidebar()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        void handleClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, modified, saving, selectedPaths])

  return (
    <div className="flex h-screen flex-col bg-base-900">
      <TitleBar modified={modified} isDraft={isDraft} theme={theme} onToggleTheme={toggleTheme} onClose={() => void handleClose()} />
      <div className="flex flex-1 min-h-0">
        <NoteSidebar
          notes={todayNotes}
          open={sidebarOpen}
          onToggle={toggleSidebar}
          onSelectNote={handleSelectNote}
          onDeleteNote={handleDeleteNote}
          onMergeNotes={handleMergeNotes}
          onSelectionChange={setSelectedPaths}
          currentNotePath={currentNotePath}
          selectedPaths={selectedPaths}
          theme={theme}
        />
        <Editor value={text} onChange={handleChange} textareaRef={textareaRef} theme={theme} fontSize={fontSize} />
      </div>
      <StatusBar
        text={text}
        saving={saving}
        savedFlash={savedFlash}
        theme={theme}
        todayCount={todayCount}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        onSave={() => void doSaveKeep()}
        onNew={() => void doNew()}
        onCancel={() => void handleClose()}
        onOpenFolder={() => void flash.showInFolder()}
      />
    </div>
  )
}
