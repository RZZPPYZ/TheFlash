interface Props {
  value: string
  onChange: (v: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
  theme: 'dark' | 'light'
  fontSize: number
}

/** The note editing surface — monospace, generous padding, light/dark aware. */
export default function Editor({ value, onChange, textareaRef, theme, fontSize }: Props): JSX.Element {
  const dark = theme === 'dark'
  return (
    <div
      className={`flex-1 overflow-hidden ${
        dark ? 'bg-base-800 text-ink-100' : 'bg-white text-zinc-900'
      }`}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        placeholder="Type your thought…  (Ctrl+S save, Ctrl+Enter save & close, Esc to close)"
        style={{ fontSize: `${fontSize}px` }}
        className={`editor-area h-full w-full resize-none bg-transparent px-5 py-4 font-mono leading-[1.65] outline-none placeholder:text-ink-500/60 ${
          dark ? 'placeholder:text-ink-500/60' : 'placeholder:text-zinc-400'
        }`}
      />
    </div>
  )
}
