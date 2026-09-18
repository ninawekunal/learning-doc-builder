import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Byline } from '@/components/byline'
import { DocBody } from '@/components/doc/doc-body'
import { DocContext } from '@/components/doc/doc-context'
import { GlossaryButton } from '@/components/doc/glossary-button'
import { RelatedLinks } from '@/components/doc/related-links'
import { useDocTitle } from '@/components/doc/use-doc-title'
import { MobileToc } from '@/components/mobile-toc'
import { Quiz } from '@/components/quiz'
import { SeriesNav } from '@/components/series-nav'
import { TocSidebar } from '@/components/toc-sidebar'
import { useActiveHeading } from '@/components/use-active-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { findEntry } from '@/lib/content'
import { parseDoc } from '@/lib/md/parse'
import type { ContentEntry, ContentKind, Heading } from '@/lib/types'

type EntryPageProps = { kind: ContentKind; bionic: boolean }

const eyebrow = (entry: ContentEntry): string =>
  entry.meta.part !== undefined
    ? `${entry.meta.series ? `${entry.meta.series} · ` : ''}Part ${entry.meta.part}`
    : (entry.meta.tags[0] ?? entry.kind)

const Missing = () => (
  <div className="py-20 text-center">
    <p className="text-[var(--text-muted)]">That page does not exist.</p>
    <Link to="/">
      <Button className="mt-4" icon={<ArrowLeft className="size-4" />}>
        Back home
      </Button>
    </Link>
  </div>
)

const Article = ({ entry, bionic }: { entry: ContentEntry; bionic: boolean }) => {
  const doc = useMemo(() => parseDoc(entry.body), [entry])
  const headings = useMemo<Heading[]>(
    () => doc.sections.map((s) => ({ id: s.id, text: s.title, level: 2 })),
    [doc],
  )
  const active = useActiveHeading(headings)
  const context = useMemo(() => ({ bionic }), [bionic])

  useDocTitle(entry.meta.title)

  return (
    <DocContext.Provider value={context}>
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">
          <MobileToc headings={headings} active={active} />

          <header className="mb-4 border-b border-[var(--border)] pb-8">
            <p className="mb-3 text-[12px] font-bold uppercase tracking-[0.14em] text-[var(--accent)]">{eyebrow(entry)}</p>
            <h1 className="font-display text-[28px] font-bold leading-[1.15] tracking-[-0.015em] sm:text-[40px]">
              {entry.meta.title}
            </h1>
            {entry.meta.summary && (
              <p className="mt-3 max-w-[62ch] text-[17px] leading-snug text-[var(--text-muted)] sm:text-[20px]">
                {entry.meta.summary}
              </p>
            )}
            <div className="mt-6">
              <Byline date={entry.meta.date} minutes={entry.meta.minutes} />
            </div>
          </header>

          <DocBody doc={doc} />

          {entry.meta.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap gap-1.5">
              {entry.meta.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          <Quiz title={entry.meta.title} items={entry.quiz} bionic={bionic} />

          <RelatedLinks links={entry.related} />

          <SeriesNav slug={entry.slug} />
        </div>

        <TocSidebar headings={headings} active={active} />
      </div>

      <GlossaryButton terms={doc.glossary} />
    </DocContext.Provider>
  )
}

export const EntryPage = ({ kind, bionic }: EntryPageProps) => {
  const { slug = '' } = useParams()
  const entry = findEntry(kind, slug)

  return entry ? <Article key={entry.slug} entry={entry} bionic={bionic} /> : <Missing />
}
