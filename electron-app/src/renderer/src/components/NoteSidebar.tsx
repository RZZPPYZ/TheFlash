import { useEffect, useState } from 'react'
import type { TodayNote } from '../../../shared/types'

interface Props {
  notes: TodayNote[]
  open: boolean
  onToggle: () => void
  onSelectNote: (note: TodayNote, content: string) => void
  theme: 'dark' | 'light'
}

export default function NoteSidebar({ notes, open, onToggle, onSelectNote, theme }: Props): JSX.Element {
  const dark = theme === 'dark'
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  useEffect(() => {
    if (!open) setExpandedIdx(null)
  }, [open])

  async function handleSelect(idx: number, note: TodayNote): Promise<void> {
    try {
      const content = await window.flash.loadNote(note.path)
      onSelectNote(note, content)
    } catch { /* ignore */ }
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
          dark ? 'text-ink-500' : 'text-zinc-400'
        }`}>
          Today ({notes.length})
        </span>
        <button
          type="button"
          onClick={onToggle}
          className={`grid h-5 w-5 place-items-center rounded transition-colors ${
            dark ? 'hover:bg-base-700 text-ink-500' : 'hover:bg-zinc-200 text-zinc-400'
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
        {notes.map((note, idx) => (
          <button
            key={note.filename}
            type="button"
            onClick={() => void handleSelect(idx, note)}
            className={`w-full text-left px-3 py-2 transition-colors ${
              dark
                ? 'hover:bg-base-800'
                : 'hover:bg-zinc-100'
            } ${expandedIdx === idx ? (dark ? 'bg-base-800' : 'bg-zinc-100') : ''}`}
            onMouseEnter={() => setExpandedIdx(idx)}
            onMouseLeave={() => setExpandedIdx(null)}
          >
            <span className={`block text-[11px] font-mono tabular-nums ${
              dark ? 'text-accent/80' : 'text-blue-500'
            }`}>
              {note.time}
            </span>
            <span className={`block text-[12px] truncate mt-0.5 ${
              dark ? 'text-ink-400' : 'text-zinc-500'
            }`}>
              {note.preview || '(empty)'}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
