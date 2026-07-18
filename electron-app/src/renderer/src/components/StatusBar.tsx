import { useState } from 'react'

interface Props {
  text: string
  saving: boolean
  savedFlash: boolean
  theme: 'dark' | 'light'
  todayCount: number
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onSave: () => void
  onNew: () => void
  onCancel: () => void
  onOpenFolder: () => void
}

export default function StatusBar({
  text,
  saving,
  savedFlash,
  theme,
  todayCount,
  sidebarOpen,
  onToggleSidebar,
  onSave,
  onNew,
  onCancel,
  onOpenFolder
}: Props): JSX.Element {
  const dark = theme === 'dark'
  const [folderHover, setFolderHover] = useState(false)

  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const chars = text.length

  return (
    <div
      className={`flex h-10 items-center justify-between px-3 text-xs ${
        dark ? 'bg-base-850 text-ink-500' : 'bg-zinc-100 text-zinc-500'
      }`}
    >
      <div className="flex items-center gap-2">
        {todayCount > 0 && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className={`flex items-center gap-1 rounded-md px-2 py-1 text-[12px] transition-colors ${
              sidebarOpen
                ? dark
                  ? 'bg-base-700 text-ink-300'
                  : 'bg-zinc-200 text-zinc-600'
                : dark
                  ? 'bg-base-700 text-ink-300 hover:bg-base-600'
                  : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
            }`}
            title="Toggle today's notes (Ctrl+Shift+H)"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 3h10M1 6h10M1 9h10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            {todayCount}
          </button>
        )}
        <button
          type="button"
          onClick={onNew}
          disabled={saving}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] transition-colors disabled:opacity-50 ${
            dark
              ? 'bg-base-700 text-ink-300 hover:bg-base-600'
              : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
          }`}
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          New
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-black transition-colors hover:bg-accent-soft disabled:opacity-50"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path
              d="M2 1.5h5.5L9.5 3.5V9.5h-7.5z"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
            <path d="M3.5 1.5V4h3V1.5" stroke="currentColor" strokeWidth="1.1" />
          </svg>
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className={`rounded-md px-3 py-1.5 text-[12px] transition-colors ${
            dark
              ? 'bg-base-700 text-ink-300 hover:bg-base-600'
              : 'bg-zinc-200 text-zinc-700 hover:bg-zinc-300'
          }`}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onOpenFolder}
          onMouseEnter={() => setFolderHover(true)}
          onMouseLeave={() => setFolderHover(false)}
          className={`ml-0.5 grid h-7 w-7 place-items-center rounded-md transition-colors ${
            dark ? 'hover:bg-base-700' : 'hover:bg-zinc-200'
          } ${folderHover ? (dark ? 'bg-base-700' : 'bg-zinc-200') : ''}`}
          title="Open notes folder"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path
              d="M1.5 3.5h4l1 1.5h6V11a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1z"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {savedFlash && (
          <span className="flex items-center gap-1 text-ok font-medium">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M2 6.5L5 9l5-6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Saved
          </span>
        )}
        <span className="tabular-nums">{words} words · {chars} chars</span>
      </div>
    </div>
  )
}
