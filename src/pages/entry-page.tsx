import { ArrowLeft } from 'lucide-react'
import { useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Byline } from '@/components/byline'
import { DocBody } from '@/components/doc/doc-body'
import { DocContext } from '@/components/doc/doc-context'
import { GlossaryButton } from '@/components/doc/glossary-button'
import { PRACTICE_ID, PracticeSection } from '@/components/doc/practice-section'
import { useDocTitle } from '@/components/doc/use-doc-title'
import { MobileToc } from '@/components/mobile-toc'
import { BackToTop } from '@/components/back-to-top'
import { SeriesNav } from '@/components/series-nav'
import { SeriesPicker } from '@/components/series-picker'
import { TocSidebar } from '@/components/toc-sidebar'
import { useActiveHeading } from '@/components/use-active-heading'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { findEntry } from '@/lib/content'
import { parseDoc } from '@/lib/md/parse'
import type { ContentEntry, ContentKind, Heading } from '@/lib/types'

type EntryPageProps = { kind: ContentKind; bionic: boolean }


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
    () => [
      ...doc.sections.map((s): Heading => ({ id: s.id, text: s.title, level: 2, optional: s.optional })),
      ...(entry.quiz.length > 0 || entry.related.length > 0
        ? [{ id: PRACTICE_ID, text: 'Practice and explore', level: 2 } satisfies Heading]
        : []),
    ],
    [doc, entry],
  )
  const active = useActiveHeading(headings)
  const context = useMemo(() => ({ bionic }), [bionic])

  useDocTitle(entry.meta.title, entry.meta.unlisted === true)

  return (
    <DocContext.Provider value={context}>
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">
          <MobileToc headings={headings} active={active} />

          <header className="mb-4 border-b border-[var(--border)] pb-8">
            {entry.meta.part !== undefined ? (
              <SeriesPicker entry={entry} />
            ) : (
              <p className="eyebrow">{entry.meta.tags[0] ?? entry.kind}</p>
            )}
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

          <PracticeSection title={entry.meta.title} quiz={entry.quiz} related={entry.related} bionic={bionic} />

          <SeriesNav entry={entry} />
        </div>

        <TocSidebar headings={headings} active={active} />
      </div>

      <GlossaryButton terms={doc.glossary} />
      <BackToTop stacked={doc.glossary.length > 0} />
    </DocContext.Provider>
  )
}

export const EntryPage = ({ kind, bionic }: EntryPageProps) => {
  const { slug = '' } = useParams()
  const entry = findEntry(kind, slug)

  return entry ? <Article key={entry.slug} entry={entry} bionic={bionic} /> : <Missing />
}
