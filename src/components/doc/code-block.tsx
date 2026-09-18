import { Check, ChevronDown, Code2, Copy } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/cn'
import { highlightCode, languageLabel } from '@/lib/highlight'

type CodeBlockProps = { code: string; lang: string }

/** Syntax-highlighted code with a language label, a copy button, and a collapse toggle. */
export const CodeBlock = ({ code, lang }: CodeBlockProps) => {
  const [open, setOpen] = useState(true)
  const [copied, setCopied] = useState(false)
  const html = useMemo(() => highlightCode(code, lang), [code, lang])

  const copy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    })
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="code-block">
      <div className="code-header">
        <CollapsibleTrigger className="code-toggle">
          <Code2 className="size-3.5" aria-hidden />
          <span>{languageLabel(lang)}</span>
          <ChevronDown className={cn('size-3.5 transition-transform', !open && '-rotate-90')} aria-hidden />
        </CollapsibleTrigger>
        <button
          type="button"
          onClick={copy}
          className="code-copy"
          aria-label={copied ? 'Copied' : 'Copy code to clipboard'}
        >
          {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <CollapsibleContent>
        {html ? (
          <div className="code-body" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className="code-body">
            <code>{code}</code>
          </pre>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
