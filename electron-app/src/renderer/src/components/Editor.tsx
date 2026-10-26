import type {
  CSSProperties,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  RefAttributes
} from 'react'
import MarkdownEditor, {
  type ICommand,
  type IMarkdownEditor,
  type MarkdownEditorRef
} from '@uiw/react-markdown-editor'
import '@uiw/react-markdown-preview/markdown.css'

interface Props {
  value: string
  onChange: (value: string) => void
  editorRef: React.RefObject<MarkdownEditorRef>
  theme: 'dark' | 'light'
  fontSize: number
}

type EditorInstance = Parameters<NonNullable<ICommand['execute']>>[0]

export type EditorHandle = MarkdownEditorRef

const MarkdownEditorWithRef = MarkdownEditor as unknown as ForwardRefExoticComponent<
  PropsWithoutRef<IMarkdownEditor> & RefAttributes<MarkdownEditorRef>
>

function insertBlock(editor: EditorInstance | null, snippet: string): void {
  const view = editor?.view
  if (!view) return

  const selection = view.state.selection.main
  const before = view.state.sliceDoc(0, selection.from)
  const leading = before.length === 0 || before.endsWith('\n\n')
    ? ''
    : before.endsWith('\n')
      ? '\n'
      : '\n\n'
  const insertion = `${leading}${snippet}`

  view.dispatch({
    changes: {
      from: selection.from,
      to: selection.to,
      insert: insertion
    },
    selection: { anchor: selection.from + insertion.length }
  })
  view.focus()
}

function setHeading(editor: EditorInstance | null, level: number): void {
  const view = editor?.view
  if (!view) return

  const selection = view.state.selection.main
  const line = view.state.doc.lineAt(selection.from)
  const title = line.text.replace(/^#{1,6}\s*/, '')
  const heading = `${'#'.repeat(level)} ${title}`

  view.dispatch({
    changes: {
      from: line.from,
      to: line.to,
      insert: heading
    },
    selection: { anchor: line.from + level + 1 + title.length }
  })
  view.focus()
}

const headingCommand: ICommand = {
  name: 'heading-level',
  keyCommand: 'heading-level',
  button: (_command, _props, { editor }) => (
    <select
      className="theflash-heading-select"
      aria-label="Choose heading level"
      title="Choose heading level"
      defaultValue=""
      onChange={(event) => {
        const level = Number(event.currentTarget.value)
        if (!level) return
        setHeading(editor.current, level)
        event.currentTarget.value = ''
      }}
    >
      <option value="" disabled>H</option>
      <option value="1">H1</option>
      <option value="2">H2</option>
      <option value="3">H3</option>
      <option value="4">H4</option>
      <option value="5">H5</option>
      <option value="6">H6</option>
    </select>
  )
}

const tableCommand: ICommand = {
  name: 'table',
  keyCommand: 'table',
  button: {
    'aria-label': 'Insert Markdown table',
    title: 'Insert table'
  },
  icon: (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.5 6h13M1.5 10h13M6 2.5v11M11 2.5v11" stroke="currentColor" strokeWidth="1" />
    </svg>
  ),
  execute: (editor) => insertBlock(
    editor,
    '| Column 1 | Column 2 |\n| --- | --- |\n|  |  |\n'
  )
}

const ruleCommand: ICommand = {
  name: 'horizontal-rule',
  keyCommand: 'horizontal-rule',
  button: {
    'aria-label': 'Insert horizontal rule',
    title: 'Insert horizontal rule'
  },
  icon: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <path d="M2 8h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M4 4h8M4 12h8" stroke="currentColor" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
    </svg>
  ),
  execute: (editor) => insertBlock(editor, '---\n')
}

const mermaidCommand: ICommand = {
  name: 'mermaid',
  keyCommand: 'mermaid',
  button: {
    'aria-label': 'Insert Mermaid diagram',
    title: 'Insert Mermaid diagram'
  },
  icon: (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1.5" y="2" width="4" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.1" />
      <rect x="10.5" y="11" width="4" height="3" rx="0.8" stroke="currentColor" strokeWidth="1.1" />
      <path d="M5.5 3.5h3A2 2 0 0 1 10.5 5.5v5.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
      <path d="m9 10 1.5 1.5L12 10" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  execute: (editor) => insertBlock(
    editor,
    '```mermaid\nflowchart LR\n  A[Start] --> B[End]\n```\n'
  )
}

export default function Editor({
  value,
  onChange,
  editorRef,
  theme,
  fontSize
}: Props): JSX.Element {
  const dark = theme === 'dark'

  return (
    <div
      className={`theflash-markdown-editor min-h-0 min-w-0 flex-1 overflow-hidden ${
        dark ? 'bg-base-800 text-ink-100' : 'bg-white text-zinc-900'
      }`}
      style={{ '--theflash-editor-font-size': `${fontSize}px` } as CSSProperties}
    >
      <MarkdownEditorWithRef
        ref={editorRef}
        value={value}
        onChange={onChange}
        theme={dark ? 'dark' : 'light'}
        enablePreview={false}
        enableScroll={false}
        toolbarsMode={[]}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLineGutter: false
        }}
        placeholder="Type Markdown here, or use the formatting toolbar..."
        aria-label="Markdown editor"
        toolbars={[
          'undo',
          'redo',
          headingCommand,
          'bold',
          'italic',
          'strike',
          'underline',
          'quote',
          'olist',
          'ulist',
          'todo',
          'link',
          'image',
          'code',
          'codeBlock',
          tableCommand,
          ruleCommand,
          mermaidCommand
        ]}
      />
    </div>
  )
}
