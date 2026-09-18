import { BookOpen } from 'lucide-react'
import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { GlossaryTerm } from '@/lib/md/types'

type TermMentionProps = { term: GlossaryTerm; children: ReactNode }

/** A jargon word in the prose: dotted accent underline, click for a plain-English definition. */
export const TermMention = ({ term, children }: TermMentionProps) => (
  <Popover>
    <PopoverTrigger asChild>
      <button type="button" className="term-mention" aria-label={`${term.label}: show definition`}>
        {children}
      </button>
    </PopoverTrigger>
    <PopoverContent>
      <p className="m-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
        <BookOpen className="size-3.5" aria-hidden />
        Word to know
      </p>
      <p className="m-0 mt-1.5 font-semibold">{term.label}</p>
      <p className="m-0 mt-1 text-[var(--text-muted)]">{term.definition}</p>
    </PopoverContent>
  </Popover>
)
