import { Check, ChevronDown, Code2, Copy, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/cn'
import { languageLabel } from '@/lib/language-label'
import type { CodeSpec } from '@/lib/md/types'

/** Highlighted HTML for one snippet; plain text until the lazy highlighter arrives. */
const useHighlighted = (code: string, lang: string): string | null => {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    // The highlighter and its grammars are a separate chunk, loaded on first use.
    void import('@/lib/highlight').then(({ highlightCode }) => {
      if (!cancelled) setHtml(highlightCode(code, lang))
    })

    return () => {
      cancelled = true
    }
  }, [code, lang])

  return html
}

export const CodeBody = ({ spec }: { spec: CodeSpec }) => {
  const html = useHighlighted(spec.text, spec.lang)

  return html ? (
    <div className="code-body" dangerouslySetInnerHTML={{ __html: html }} />
  ) : (
    <pre className="code-body">
      <code>{spec.text}</code>
    </pre>
  )
}

const saveFile = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }))
  const link = document.createElement('a')

  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Copy and (optionally) Download buttons for the snippet currently shown. */
export const CodeActions = ({ spec }: { spec: CodeSpec }) => {
  const [copied, setCopied] = useState(false)

  const copy = () => {
    void navigator.clipboard.writeText(spec.text).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <span className="code-actions">
      {spec.download && (
        <button type="button" onClick={() => saveFile(spec.download!, spec.text)} className="code-copy">
          <Download className="size-3.5" aria-hidden />
          <span>Download</span>
        </button>
      )}
      <button type="button" onClick={copy} className="code-copy" aria-label={copied ? 'Copied' : 'Copy code'}>
        {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
        <span className="max-sm:hidden">{copied ? 'Copied' : 'Copy'}</span>
      </button>
    </span>
  )
}

type CodeFrameProps = { label: ReactNode; defaultOpen: boolean; actions: ReactNode; lines: number; children: ReactNode }

/** The collapsible shell shared by single and tabbed code blocks. */
export const CodeFrame = ({ label, defaultOpen, actions, lines, children }: CodeFrameProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="code-block">
      <div className="code-header">
        <CollapsibleTrigger className="code-toggle">
          <ChevronDown className={cn('size-3.5 transition-transform', !open && '-rotate-90')} aria-hidden />
          <Code2 className="size-3.5" aria-hidden />
          {label}
          {!open && <span className="code-hint">{lines} lines - show code</span>}
        </CollapsibleTrigger>
        {actions}
      </div>
      <CollapsibleContent>{children}</CollapsibleContent>
    </Collapsible>
  )
}

export const codeLabel = (spec: CodeSpec): ReactNode => (
  <>
    <span className="code-title">{spec.title ?? languageLabel(spec.lang)}</span>
    {spec.title && <span className="code-lang">{languageLabel(spec.lang)}</span>}
  </>
)

export const lineCount = (text: string): number => text.split('\n').length

/** A single code block: collapsed until the reader asks for it, with copy and download. */
export const CodeBlock = ({ spec }: { spec: CodeSpec }) => (
  <CodeFrame
    label={codeLabel(spec)}
    defaultOpen={spec.open}
    actions={<CodeActions spec={spec} />}
    lines={lineCount(spec.text)}
  >
    <CodeBody spec={spec} />
  </CodeFrame>
)
