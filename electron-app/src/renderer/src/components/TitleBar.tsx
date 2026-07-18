import { useState } from 'react'
import type { ThemeName } from '../../shared/types'

interface Props {
  modified: boolean
  isDraft: boolean
  theme: ThemeName
  onToggleTheme: () => void
  onClose: () => void
}

export default function TitleBar({ modified, isDraft, theme, onToggleTheme, onClose }: Props): JSX.Element {
  const [hover, setHover] = useState(false)
  const dark = theme === 'dark'

  return (
    <div
      className={`flex h-9 items-center justify-between px-3 ${
        dark ? 'bg-base-850' : 'bg-zinc-100'
      }`}
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 select-none">
        <span className="text-accent text-base leading-none">⚡</span>
        <span className={`text-xs font-medium tracking-wide ${
          dark ? 'text-ink-300' : 'text-zinc-600'
        }`}>The Flash</span>
        {modified && (
          <span className="flex items-center gap-1 text-[11px] text-accent/90">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            {isDraft ? 'Draft' : 'Unsaved'}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button
          type="button"
          onClick={onToggleTheme}
          className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
            dark ? 'text-ink-300 hover:bg-base-700' : 'text-zinc-500 hover:bg-zinc-200'
          }`}
          title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {dark ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm0 12.5V2.5a5.5 5.5 0 0 1 0 11z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.05 3.05l1.41 1.41M11.54 11.54l1.41 1.41M3.05 12.95l1.41-1.41M11.54 4.46l1.41-1.41" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          )}
        </button>
        <button
          type="button"
          aria-label="Close"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={onClose}
          className={`grid h-7 w-7 place-items-center rounded-md transition-colors ${
            dark ? 'text-ink-300' : 'text-zinc-500'
          } ${hover ? 'bg-danger/90 text-white' : dark ? 'hover:bg-base-700' : 'hover:bg-zinc-200'}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M2 2l8 8M10 2l-8 8"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
