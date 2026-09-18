import { BookOpen } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import type { GlossaryTerm } from '@/lib/md/types'

/** Floating bottom-right button that opens the doc's "Words you will meet" list. */
export const GlossaryButton = ({ terms }: { terms: GlossaryTerm[] }) => {
  if (terms.length === 0) return null

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button type="button" className="glossary-fab" aria-label={`Words you will meet (${terms.length})`}>
          <BookOpen className="size-5" aria-hidden />
          <span className="glossary-fab-count" aria-hidden>
            {terms.length}
          </span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <div className="border-b border-[var(--border)] px-5 pb-3 pt-5">
          <DialogTitle>Words you will meet</DialogTitle>
          <DialogDescription className="mt-1">
            Plain-English meanings. Underlined words in the doc open these too.
          </DialogDescription>
        </div>
        <dl className="m-0 overflow-y-auto px-5 py-3">
          {terms.map((term) => (
            <div key={term.label} className="border-b border-[var(--border)] py-3 last:border-0">
              <dt className="font-semibold">{term.label}</dt>
              <dd className="m-0 mt-0.5 text-[14px] leading-relaxed text-[var(--text-muted)]">{term.definition}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  )
}
