import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import TitleBar from './components/TitleBar'
import Editor, { type EditorHandle } from './components/Editor'
import StatusBar from './components/StatusBar'
import NoteSidebar from './components/NoteSidebar'
import { flash } from './lib/ipc'
import type { AppConfig, NoteSummary, ThemeName } from '../../shared/types'

const MarkdownPreview = lazy(() => import('./components/MarkdownPreview'))

export default function App(): JSX.Element {
  const [text, setText] = useState('')
  const [modified, setModified] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [isDraft, setIsDraft] = useState(false)
  const [noteCount, setNoteCount] = useState(0)
  const [notes, setNotes] = useState<NoteSummary[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [currentNotePath, setCurrentNotePath] = useState<string | null>(null)
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem('theflash-fontsize')
    return saved ? parseInt(saved, 10) : 13
  })
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const editorRef = useRef<EditorHandle>(null)
  const savedFlashTimer = useRef<number | null>(null)
  const draftTimerRef = useRef<number | null>(null)

  useEffect(() => {
    flash.getConfig().then((cfg: AppConfig) => setTheme(cfg.theme))
  }, [])

  function refreshNotes(openSidebar = false): void {
    void Promise.all([flash.getNoteCount(), flash.getNotes()]).then(([count, nextNotes]) => {
      setNoteCount(count)
      setNotes(nextNotes)
      if (openSidebar && nextNotes.length > 0) {
        setSidebarOpen(true)
      }
    })
  }

  useEffect(() => {
    refreshNotes(true)
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.setAttribute('data-color-mode', theme)
  }, [theme])

  useEffect(() => {
    let cancelled = false
    void flash.getDraft().then((draft) => {
      if (cancelled || !draft) return
      setText(draft.text)
      setModified(true)
      setIsDraft(draft.notePath === null)
      setSavedFlash(false)
      setCurrentNotePath(draft.notePath)
      setPreviewMode(false)
      refreshNotes(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const offClear = flash.onClearEditor(() => {
      clearSavedDraft()
      setText('')
      setModified(false)
      setIsDraft(false)
      setSavedFlash(false)
      setCurrentNotePath(null)
      setPreviewMode(false)
      refreshNotes(true)
    })
    const offFocus = flash.onFocusEditor(() => {
      focusEditor()
    })
    return () => {
      offClear()
      offFocus()
    }
  }, [])

  useEffect(() => {
    if (notes.length > 0) setSidebarOpen(true)
  }, [notes.length])

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

  function focusEditor(): void {
    requestAnimationFrame(() => editorRef.current?.editor.current?.view?.focus())
  }

  function cancelDraftTimer(): void {
    if (draftTimerRef.current) {
      window.clearTimeout(draftTimerRef.current)
      draftTimerRef.current = null
    }
  }

  function clearSavedDraft(): void {
    cancelDraftTimer()
    void flash.clearDraft()
  }

  function handleChange(v: string): void {
    setText(v)
    setModified(true)
    setIsDraft(false)
    cancelDraftTimer()
    draftTimerRef.current = window.setTimeout(() => {
      draftTimerRef.current = null
      if (v.trim()) {
        void flash.saveDraft(v, currentNotePath)
      } else {
        void flash.clearDraft()
      }
    }, 1500)
  }

  /** Save: update existing note in-place, or create new if none tracked. */
  async function doSaveKeep(): Promise<void> {
    if (saving) return
    // If editing an existing note and content was cleared, delete the note file.
    if (!text.trim()) {
      if (currentNotePath) {
        try {
          await flash.deleteNote(currentNotePath)
        } catch (e) {
          console.error('[save-delete] failed:', e)
        }
        setCurrentNotePath(null)
      }
      setModified(false)
      setIsDraft(false)
      clearSavedDraft()
      refreshNotes()
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
      clearSavedDraft()
      refreshNotes()
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
      if (currentNotePath) {
        try {
          await flash.deleteNote(currentNotePath)
        } catch (e) {
          console.error('[save-close-delete] failed:', e)
        }
        setCurrentNotePath(null)
      }
      setModified(false)
      setIsDraft(false)
      clearSavedDraft()
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
      clearSavedDraft()
      refreshNotes()
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
    clearSavedDraft()
    setText('')
    setModified(false)
    setIsDraft(false)
    setSavedFlash(false)
    setCurrentNotePath(null)
    setPreviewMode(false)
    refreshNotes()
    focusEditor()
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
        clearSavedDraft()
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
      refreshNotes()
    }
    setSidebarOpen((v) => !v)
  }

  function toggleTheme(): void {
    const next: ThemeName = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    void flash.setTheme(next)
  }

  function handlePreviewModeChange(preview: boolean): void {
    setPreviewMode(preview)
    if (!preview) {
      focusEditor()
    }
  }

  function togglePreviewMode(): void {
    setPreviewMode((current) => {
      const next = !current
      if (!next) {
        focusEditor()
      }
      return next
    })
  }

  function handleSelectNote(note: NoteSummary, content: string): void {
    clearSavedDraft()
    setText(content)
    setModified(false)
    setIsDraft(false)
    setCurrentNotePath(note.path)
    focusEditor()
  }

  async function handleDeleteNote(filepath: string): Promise<void> {
    try {
      await flash.deleteNote(filepath)
      if (currentNotePath === filepath) {
        clearSavedDraft()
        setText('')
        setModified(false)
        setIsDraft(false)
        setCurrentNotePath(null)
      }
      setSelectedPaths((prev) => {
        const next = new Set(prev)
        next.delete(filepath)
        return next
      })
      refreshNotes()
    } catch (e) {
      console.error('[delete] failed:', e)
    }
  }

  async function handleMergeNotes(selectedNotes: NoteSummary[]): Promise<void> {
    if (selectedNotes.length < 2) return
    try {
      const contents = await Promise.all(
        selectedNotes.map((n) => flash.loadNote(n.path))
      )
      const merged = contents
        .map((content) => content.replace(/\r\n?/g, '\n').trimEnd())
        .join('\n\n---\n\n')
      // Save merged content as a new note.
      const result = await flash.saveNote(merged)
      // Delete the original notes.
      await Promise.all(selectedNotes.map((n) => flash.deleteNote(n.path)))
      // Load the merged note into the editor.
      if (result) {
        setText(merged)
        setModified(false)
        setCurrentNotePath(result.path)
        setIsDraft(false)
      }
      clearSavedDraft()
      setSelectedPaths(new Set())
      refreshNotes()
      focusEditor()
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
          const selected = notes.filter((n) => selectedPaths.has(n.path))
          void handleMergeNotes(selected)
        }
      } else if (mod && e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault()
        toggleSidebar()
      } else if (mod && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault()
        togglePreviewMode()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        void handleClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, modified, saving, selectedPaths, notes])

  return (
    <div className="flex h-screen flex-col bg-base-900">
      <TitleBar
        modified={modified}
        isDraft={isDraft}
        theme={theme}
        previewMode={previewMode}
        onPreviewModeChange={handlePreviewModeChange}
        onToggleTheme={toggleTheme}
        onClose={() => void handleClose()}
      />
      <div className="flex flex-1 min-h-0">
        <NoteSidebar
          notes={notes}
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
        {previewMode ? (
          <Suspense
            fallback={
              <div className={`grid min-w-0 flex-1 place-items-center text-xs ${
                theme === 'dark' ? 'bg-base-800 text-ink-500' : 'bg-white text-zinc-400'
              }`}>
                Loading preview...
              </div>
            }
          >
            <MarkdownPreview value={text} theme={theme} />
          </Suspense>
        ) : (
          <Editor value={text} onChange={handleChange} editorRef={editorRef} theme={theme} fontSize={fontSize} />
        )}
      </div>
      <StatusBar
        text={text}
        saving={saving}
        savedFlash={savedFlash}
        theme={theme}
        noteCount={noteCount}
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
