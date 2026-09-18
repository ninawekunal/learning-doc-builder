import { Check, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/cn'
import { seriesParts } from '@/lib/content'
import type { ContentEntry } from '@/lib/types'

/** The "Series · Part N" eyebrow, which opens a list of every part to jump to. */
export const SeriesPicker = ({ entry }: { entry: ContentEntry }) => {
  const [open, setOpen] = useState(false)
  const parts = seriesParts(entry)

  if (!entry.meta.series || parts.length < 2) {
    return <p className="eyebrow">{entry.meta.series ? `${entry.meta.series} · ` : ''}{`Part ${entry.meta.part}`}</p>
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="eyebrow eyebrow-button">
        {entry.meta.series} · Part {entry.meta.part} of {parts.length}
        <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[22rem] p-1.5">
        <p className="px-2.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-muted)]">
          {entry.meta.series}
        </p>
        <ol className="m-0 max-h-[60vh] list-none overflow-y-auto p-0">
          {parts.map((part) => {
            const current = part.slug === entry.slug

            return (
              <li key={part.slug}>
                <Link
                  to={`/docs/${part.slug}`}
                  onClick={() => setOpen(false)}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-[14px] leading-snug',
                    current ? 'bg-[var(--primary-soft)] text-[var(--primary)]' : 'hover:bg-[var(--surface-2)]',
                  )}
                >
                  <span className="toc-num mt-px">{part.meta.part}</span>
                  <span className="min-w-0 flex-1">{part.meta.title}</span>
                  {current && <Check className="mt-0.5 size-4 shrink-0" aria-hidden />}
                </Link>
              </li>
            )
          })}
        </ol>
      </PopoverContent>
    </Popover>
  )
}
