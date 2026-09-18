import { Dumbbell } from 'lucide-react'
import { PRACTICE_ID } from '@/components/doc/practice-section'
import { cn } from '@/lib/cn'
import { scrollToSection } from '@/lib/scroll-to'
import type { Heading } from '@/lib/types'

/** A numbered pill per section; the practice stop gets a dumbbell instead. */
export const TocMarker = ({ heading, index, headings }: { heading: Heading; index: number; headings: Heading[] }) =>
  heading.id === PRACTICE_ID ? (
    <span className="toc-num toc-num-practice" aria-hidden>
      <Dumbbell className="size-3" />
    </span>
  ) : (
    <span className="toc-num" aria-hidden>
      {headings.filter((h, i) => h.level === 2 && i <= index).length}
    </span>
  )

type TocSidebarProps = { headings: Heading[]; active: string }

export const TocSidebar = ({ headings, active }: TocSidebarProps) => {
  if (headings.length === 0) return null

  return (
    <nav
      aria-label="On this page"
      className="sticky top-24 hidden max-h-[calc(100vh-8rem)] w-60 shrink-0 overflow-y-auto lg:block"
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">
        On this page
      </p>
      <ul className="space-y-0.5">
        {headings.map((heading, index) => (
          <li key={heading.id}>
            <a
              href={`#${heading.id}`}
              onClick={(event) => scrollToSection(event, heading.id)}
              className={cn(
                'toc-link flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors',
                active === heading.id
                  ? 'toc-link-active bg-[var(--primary-soft)] text-[var(--primary)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
              )}
            >
              <TocMarker heading={heading} index={index} headings={headings} />
              <span className="min-w-0 flex-1">
                {heading.text}
                {heading.optional && <span className="toc-optional">Optional</span>}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
