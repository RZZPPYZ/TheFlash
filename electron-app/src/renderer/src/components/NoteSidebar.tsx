import { useEffect, useState } from 'react'
import type { TodayNote } from '../../../shared/types'

interface Props {
  notes: TodayNote[]
  open: boolean
  onToggle: () => void
  onSelectNote: (note: TodayNote, content: string) => void
  onDeleteNote: (filepath: string) => void
  currentNotePath: string | null
  theme: 'dark' | 'light'
}

export default function NoteSidebar({
  notes,
  open,
  onToggle,
  onSelectNote,
  onDeleteNote,
  currentNotePath,
  theme
}: Props): JSX.Element {
  const dark = theme === 'dark'
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  // Clear hover when sidebar closes.
  useEffect(() => {
    if (!open) setHoveredIdx(null)
  }, [open])

  async function handleSelect(idx: number, note: TodayNote): Promise<void> {
    try {
      const content = await window.flash.loadNote(note.path)
      onSelectNote(note, content)
    } catch { /* ignore */ }
  }

  function handleDelete(e: React.MouseEvent, filepath: string): void {
    e.stopPropagation()
    void onDeleteNote(filepath)
  }

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
          Today ({notes.length})
        </span>
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

      {/* Note list */}
      <div className="flex-1 overflow-y-auto">
        {notes.map((note, idx) => {
          const isActive = currentNotePath === note.path
          return (
            <div
              key={note.filename}
              className={`group flex items-start gap-1 px-3 py-2 cursor-pointer transition-colors ${
                dark
                  ? isActive
                    ? 'bg-accent/15 border-l-2 border-accent'
                    : 'hover:bg-base-800 border-l-2 border-transparent'
                  : isActive
                    ? 'bg-amber-50 border-l-2 border-amber-400'
                    : 'hover:bg-zinc-100 border-l-2 border-transparent'
              }`}
              onClick={() => void handleSelect(idx, note)}
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
              {(hoveredIdx === idx || isActive) && (
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
            </div>
          )
        })}
      </div>
    </div>
  )
}
