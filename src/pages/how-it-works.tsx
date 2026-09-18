import { useMemo } from 'react'
import raw from '/content/how-it-works.md?raw'
import { DocBody } from '@/components/doc/doc-body'
import { DocContext } from '@/components/doc/doc-context'
import { useDocTitle } from '@/components/doc/use-doc-title'
import { MobileToc } from '@/components/mobile-toc'
import { TocSidebar } from '@/components/toc-sidebar'
import { useActiveHeading } from '@/components/use-active-heading'
import { parseFrontmatter } from '@/lib/frontmatter'
import { parseDoc } from '@/lib/md/parse'
import type { Heading } from '@/lib/types'

export const HowItWorks = ({ bionic }: { bionic: boolean }) => {
  const { meta, doc } = useMemo(() => {
    const parsed = parseFrontmatter(raw)

    return { meta: parsed.meta, doc: parseDoc(parsed.body) }
  }, [])
  const headings = useMemo<Heading[]>(() => doc.sections.map((s) => ({ id: s.id, text: s.title, level: 2 })), [doc])
  const active = useActiveHeading(headings)
  const context = useMemo(() => ({ bionic }), [bionic])

  useDocTitle(meta.title)

  return (
    <DocContext.Provider value={context}>
      <div className="flex gap-10">
        <div className="min-w-0 flex-1">
          <MobileToc headings={headings} active={active} />
          <h1 className="font-display text-[28px] font-bold leading-tight tracking-tight sm:text-[36px]">{meta.title}</h1>
          <p className="mb-6 mt-2 max-w-[62ch] text-[17px] text-[var(--text-muted)]">{meta.summary}</p>
          <DocBody doc={doc} />
        </div>
        <TocSidebar headings={headings} active={active} />
      </div>
    </DocContext.Provider>
  )
}
