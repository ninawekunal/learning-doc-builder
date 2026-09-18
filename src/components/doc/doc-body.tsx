import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Blocks } from '@/components/doc/blocks'
import { Inline } from '@/components/doc/inline'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/cn'
import type { ParsedDoc, Section } from '@/lib/md/types'

const SectionLabel = ({ section, total }: { section: Section; total: number }) => (
  <p className="section-number">
    Section {section.number} of {total}
    {section.optional && <span className="section-optional">Optional</span>}
  </p>
)

/** "## Optional: ..." sections: the heading stays visible, the body waits for a click. */
const OptionalSection = ({ section, total }: { section: Section; total: number }) => {
  const [open, setOpen] = useState(false)

  return (
    <Collapsible open={open} onOpenChange={setOpen} asChild>
      <section className="doc-section" aria-labelledby={section.id}>
        <SectionLabel section={section} total={total} />
        <CollapsibleTrigger className="optional-trigger">
          <h2 id={section.id}>
            <Inline tokens={section.titleTokens} />
          </h2>
          <ChevronDown className={cn('size-5 shrink-0 transition-transform', !open && '-rotate-90')} aria-hidden />
        </CollapsibleTrigger>
        {!open && <p className="optional-hint">Nice to have, not needed for what comes next. Tap to open.</p>}
        <CollapsibleContent>
          <Blocks blocks={section.blocks} />
        </CollapsibleContent>
      </section>
    </Collapsible>
  )
}

/** The article: numbered sections, each separated from the last by a rule. */
export const DocBody = ({ doc }: { doc: ParsedDoc }) => (
  <article className="prose">
    <Blocks blocks={doc.preamble} />
    {doc.sections.map((section) =>
      section.optional ? (
        <OptionalSection key={section.id} section={section} total={doc.sections.length} />
      ) : (
        <section key={section.id} className="doc-section" aria-labelledby={section.id}>
          <SectionLabel section={section} total={doc.sections.length} />
          <h2 id={section.id}>
            <Inline tokens={section.titleTokens} />
          </h2>
          <Blocks blocks={section.blocks} />
        </section>
      ),
    )}
  </article>
)
