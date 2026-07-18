import { useEffect, useState } from 'react'

interface Props {
  modified: boolean
  onClose: () => void
}

/** Frameless title bar — drag region + unsaved dot + close (✕). */
export default function TitleBar({ modified, onClose }: Props): JSX.Element {
  const [hover, setHover] = useState(false)

  // Double-click maximizes are disabled in main (maximizable:false) — no-op drag only.
  return (
    <div
      className="flex h-9 items-center justify-between bg-base-850 px-3"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center gap-2 select-none">
        <span className="text-accent text-base leading-none">⚡</span>
        <span className="text-ink-300 text-xs font-medium tracking-wide">The Flash</span>
        {modified && (
          <span className="flex items-center gap-1 text-[11px] text-accent/90">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
            Unsaved
          </span>
        )}
      </div>
      <button
        type="button"
        aria-label="Close"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClose}
        className={`grid h-7 w-7 place-items-center rounded-md text-ink-300 transition-colors ${
          hover ? 'bg-danger/90 text-white' : 'hover:bg-base-700'
        }`}
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
  )
}
