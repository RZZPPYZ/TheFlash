import { useEffect, useState } from 'react'
import type { TodayNote } from '../../../shared/types'

interface Props {
  notes: TodayNote[]
  open: boolean
  onToggle: () => void
  onSelectNote: (note: TodayNote, content: string) => void
  onDeleteNote: (filepath: string) => void
  onMergeNotes: (notes: TodayNote[]) => void
  onSelectionChange: (paths: Set<string>) => void
  currentNotePath: string | null
  selectedPaths: Set<string>
  theme: 'dark' | 'light'
}

export default function NoteSidebar({
  notes,
  open,
  onToggle,
  onSelectNote,
  onDeleteNote,
  onMergeNotes,
  onSelectionChange,
  currentNotePath,
  selectedPaths,
  theme
}: Props): JSX.Element {
  const dark = theme === 'dark'
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Clear hover when sidebar closes.
  useEffect(() => {
    if (!open) {
      setHoveredIdx(null)
      onSelectionChange(new Set())
    }
  }, [open])

  async function handleClick(e: React.MouseEvent, note: TodayNote): Promise<void> {
    // Ctrl+click: toggle multi-select
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selectedPaths)
      if (next.has(note.path)) {
        next.delete(note.path)
      } else {
        next.add(note.path)
      }
      onSelectionChange(next)
      return
    }

    // Normal click without Ctrl: clear selection, load note
    onSelectionChange(new Set())
    try {
      const content = await window.flash.loadNote(note.path)
      onSelectNote(note, content)
    } catch { /* ignore */ }
  }

  function handleDelete(e: React.MouseEvent, filepath: string): void {
    e.stopPropagation()
    const next = new Set(selectedPaths)
    next.delete(filepath)
    onSelectionChange(next)
    void onDeleteNote(filepath)
  }

  function doMerge(): void {
    const selected = notes.filter((n) => selectedPaths.has(n.path))
    if (selected.length >= 2) {
      onMergeNotes(selected)
      onSelectionChange(new Set())
    }
  }

  const canMerge = selectedPaths.size >= 2

  return (
    <div
      className={`flex flex-col shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out ${
        dark ? 'bg-base-850 border-r border-base-700' : 'bg-zinc-50 border-r border-zinc-200'
      }`}
      style={{ width: open ? '180px' : '0px' }}
    >
      {/* Sidebar header */}
      <div className={`flex items-center justify-between px-3 py-2 shrink-0 ${
        dark ? 'bg-base-900/50' : 'bg-zinc-100'
      }`}>
        <span className={`text-[11px] font-semibold uppercase tracking-wider ${
          dark ? 'text-ink-300' : 'text-zinc-500'
        }`}>
          {canMerge ? `Merge (${selectedPaths.size})` : `Today (${notes.length})`}
        </span>
        <div className="flex items-center gap-1">
          {canMerge && (
            <button
              type="button"
              onClick={doMerge}
              className={`grid h-5 w-5 place-items-center rounded transition-colors ${
                dark ? 'hover:bg-accent/20 text-accent' : 'hover:bg-amber-100 text-amber-600'
              }`}
              title="Merge selected notes (Ctrl+E)"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                <path d="M1 1h3v3H1zM8 1h3v3H8zM1 8h3v3H1zM8 8h3v3H8z" stroke="currentColor" strokeWidth="0.9" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            className={`grid h-5 w-5 place-items-center rounded transition-colors ${
              dark ? 'hover:bg-base-700 text-ink-300' : 'hover:bg-zinc-200 text-zinc-500'
            }`}
            title="Collapse sidebar"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M7 1L3 5l4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Merge hint */}
      {selectedPaths.size > 0 && (
        <div className={`px-3 py-1 text-[10px] ${
          dark ? 'text-ink-500 bg-base-900/30' : 'text-zinc-400 bg-zinc-100/50'
        }`}>
          Ctrl+click to select, Ctrl+E to merge
        </div>
      )}

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {notes.map((note, idx) => {
          const isActive = currentNotePath === note.path
          const isSelected = selectedPaths.has(note.path)
          return (
            <div
              key={note.filename}
              className={`group flex items-start gap-1 px-3 py-2 cursor-pointer transition-colors border-l-2 ${
                dark
                  ? isSelected
                    ? 'bg-accent/25 border-accent'
                    : isActive
                      ? 'bg-accent/15 border-accent'
                      : 'hover:bg-base-800 border-transparent'
                  : isSelected
                    ? 'bg-amber-100 border-amber-400'
                    : isActive
                      ? 'bg-amber-50 border-amber-400'
                      : 'hover:bg-zinc-100 border-transparent'
              }`}
              onClick={(e) => void handleClick(e, note)}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="flex-1 min-w-0">
                <span className={`block text-[12px] font-mono tabular-nums ${
                  dark ? 'text-accent' : 'text-amber-600'
                }`}>
                  {note.time}
                </span>
                <span className={`block text-[12px] truncate mt-0.5 ${
                  dark ? 'text-ink-100' : 'text-zinc-800'
                }`}>
                  {note.preview || '(empty)'}
                </span>
              </div>
              {/* Delete button — visible on hover */}
              {(hoveredIdx === idx || isActive) && !isSelected && (
                <button
                  type="button"
                  onClick={(e) => handleDelete(e, note.path)}
                  className={`shrink-0 grid h-5 w-5 place-items-center rounded transition-colors ${
                    dark
                      ? 'text-ink-500 hover:bg-danger/20 hover:text-danger'
                      : 'text-zinc-400 hover:bg-red-50 hover:text-red-500'
                  }`}
                  title="Delete note"
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M1.5 2.5h7M3.5 2.5V1.5h3v1M3 2.5l.5 5h3l.5-5" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              {/* Selection checkbox for multi-select */}
              {isSelected && (
                <span className={`shrink-0 grid h-5 w-5 place-items-center rounded ${
                  dark ? 'text-accent' : 'text-amber-500'
                }`}>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M3.5 6l2 2 3-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
