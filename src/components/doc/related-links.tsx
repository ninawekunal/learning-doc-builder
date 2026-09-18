import { ArrowUpRight, BookMarked, Dumbbell, PlayCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { RelatedLink } from '@/lib/md/types'

const KIND: Record<RelatedLink['kind'], { label: string; icon: LucideIcon }> = {
  practice: { label: 'Practice', icon: Dumbbell },
  read: { label: 'Read', icon: BookMarked },
  watch: { label: 'Watch', icon: PlayCircle },
}

/** "Practice and explore": exercises and further reading chosen for this doc. */
export const RelatedLinks = ({ links }: { links: RelatedLink[] }) => {
  if (links.length === 0) return null

  return (
    <section className="mt-12" aria-labelledby="practice-and-explore">
      <h2 id="practice-and-explore" className="font-display text-[22px] font-bold tracking-tight">
        Practice and explore
      </h2>
      <p className="mt-1 text-[15px] text-[var(--text-muted)]">
        Put it to work. Hands-on exercises first, then reading to go deeper.
      </p>
      <ul className="mt-5 grid list-none gap-3 p-0 sm:grid-cols-2">
        {links.map((link) => {
          const kind = KIND[link.kind]
          const Icon = kind.icon

          return (
            <li key={link.url}>
              <a href={link.url} target="_blank" rel="noreferrer" className="related-card group">
                <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--accent)]">
                  <Icon className="size-3.5" aria-hidden />
                  {kind.label} · {link.source}
                  <ArrowUpRight className="ml-auto size-4 text-[var(--text-muted)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </span>
                <span className="mt-1.5 block font-semibold leading-snug text-[var(--text)]">{link.title}</span>
                <span className="mt-1 block text-[14px] leading-relaxed text-[var(--text-muted)]">{link.note}</span>
                {link.difficulty && <Badge className="mt-2">{link.difficulty}</Badge>}
              </a>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
