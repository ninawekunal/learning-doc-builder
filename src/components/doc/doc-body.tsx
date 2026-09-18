import { Inline } from '@/components/doc/inline'
import { Blocks } from '@/components/doc/blocks'
import type { ParsedDoc } from '@/lib/md/types'

/** The article: numbered sections, each separated from the last by a rule. */
export const DocBody = ({ doc }: { doc: ParsedDoc }) => (
  <article className="prose">
    <Blocks blocks={doc.preamble} />
    {doc.sections.map((section) => (
      <section key={section.id} className="doc-section" aria-labelledby={section.id}>
        <p className="section-number">
          Section {section.number} of {doc.sections.length}
        </p>
        <h2 id={section.id}>
          <Inline tokens={section.titleTokens} />
        </h2>
        <Blocks blocks={section.blocks} />
      </section>
    ))}
  </article>
)
