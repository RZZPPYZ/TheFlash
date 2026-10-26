import {
  Children,
  isValidElement,
  useEffect,
  useState,
  type ReactNode
} from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema, type Options as SanitizeOptions } from 'rehype-sanitize'
import mermaid from 'mermaid'

interface Props {
  value: string
  theme: 'dark' | 'light'
}

let mermaidRenderSequence = 0

const markdownSanitizeSchema: SanitizeOptions = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), 'u'],
  attributes: {
    ...defaultSchema.attributes,
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ['className', /^language-/]
    ]
  }
}

function getMermaidSource(children: ReactNode): string | null {
  const child = Children.toArray(children).find(isValidElement)
  if (!child || !isValidElement(child)) return null

  const props = child.props as { className?: string; children?: ReactNode }
  const languages = (props.className ?? '').split(/\s+/)
  if (!languages.includes('language-mermaid')) return null

  return String(props.children ?? '').replace(/\n$/, '')
}

function MermaidDiagram({ chart, theme }: { chart: string; theme: 'dark' | 'light' }): JSX.Element {
  const [svg, setSvg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    const dark = theme === 'dark'
    const renderId = `theflash-mermaid-${++mermaidRenderSequence}`

    setSvg('')
    setError('')

    void mermaid
      .initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        suppressErrorRendering: true,
        theme: dark ? 'dark' : 'default',
        darkMode: dark,
        fontFamily: 'Inter, Segoe UI, sans-serif',
        themeVariables: dark
          ? {
              background: '#1e1e20',
              primaryColor: '#2a2a2e',
              primaryTextColor: '#f5f5f7',
              primaryBorderColor: '#f59e0b',
              secondaryColor: '#333338',
              tertiaryColor: '#242427',
              lineColor: '#8e8e93',
              textColor: '#f5f5f7'
            }
          : {
              background: '#ffffff',
              primaryColor: '#fef3c7',
              primaryTextColor: '#27272a',
              primaryBorderColor: '#d97706',
              secondaryColor: '#f4f4f5',
              tertiaryColor: '#fafafa',
              lineColor: '#71717a',
              textColor: '#27272a'
            }
      })

    void mermaid
      .render(renderId, chart)
      .then(({ svg: renderedSvg }) => {
        if (!cancelled) setSvg(renderedSvg)
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : String(reason))
        }
      })

    return () => {
      cancelled = true
    }
  }, [chart, theme])

  if (error) {
    return (
      <div className="mermaid-error" role="alert">
        <div className="mermaid-error-title">Unable to render Mermaid diagram</div>
        <div className="mermaid-error-detail">{error}</div>
        <pre>{chart}</pre>
      </div>
    )
  }

  if (!svg) {
    return (
      <div className="mermaid-block" aria-busy="true">
        <span className="mermaid-status">Rendering diagram...</span>
      </div>
    )
  }

  return (
    <div
      className="mermaid-block"
      role="img"
      aria-label="Mermaid diagram"
      // Mermaid sanitizes generated SVG internally; strict security mode is enabled above.
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  )
}

export default function MarkdownPreview({ value, theme }: Props): JSX.Element {
  const dark = theme === 'dark'

  return (
    <div
      className={`min-h-0 min-w-0 flex-1 overflow-y-auto ${
        dark ? 'bg-base-800 text-ink-100' : 'bg-white text-zinc-900'
      }`}
      aria-label="Markdown preview"
    >
      {value.trim() ? (
        <article className="markdown-preview mx-auto w-full max-w-3xl px-5 py-4">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw, [rehypeSanitize, markdownSanitizeSchema]]}
            components={{
              pre({ children }) {
                const chart = getMermaidSource(children)
                if (chart !== null) {
                  return <MermaidDiagram chart={chart} theme={theme} />
                }
                return <pre>{children}</pre>
              },
              code({ node: _node, className, children, ...props }) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
              a({ node: _node, href, children, ...props }) {
                const external = Boolean(href && /^https?:\/\//i.test(href))
                return (
                  <a
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noreferrer' : undefined}
                    {...props}
                  >
                    {children}
                  </a>
                )
              }
            }}
          >
            {value}
          </ReactMarkdown>
        </article>
      ) : (
        <div className={`grid h-full place-items-center text-xs ${dark ? 'text-ink-500' : 'text-zinc-400'}`}>
          Nothing to preview
        </div>
      )}
    </div>
  )
}
