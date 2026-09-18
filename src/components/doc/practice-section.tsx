import { Quiz } from '@/components/quiz'
import { RelatedLinks } from '@/components/doc/related-links'
import type { RelatedLink } from '@/lib/md/types'
import type { QuizItem } from '@/lib/types'

export const PRACTICE_ID = 'practice-and-explore'

type PracticeSectionProps = { title: string; quiz: QuizItem[]; related: RelatedLink[]; bionic: boolean }

/** The last stop of every doc: test your recall, then practise on real exercises. */
export const PracticeSection = ({ title, quiz, related, bionic }: PracticeSectionProps) => {
  if (quiz.length === 0 && related.length === 0) return null

  return (
    <section className="practice-section" aria-labelledby={PRACTICE_ID}>
      <p className="section-number">Your turn</p>
      <h2 id={PRACTICE_ID} className="font-display text-[26px] font-bold tracking-tight">
        Practice and explore
      </h2>
      <p className="mt-1 text-[15px] text-[var(--text-muted)]">
        First check what stuck, then put it to work on real exercises.
      </p>
      <Quiz title={title} items={quiz} bionic={bionic} />
      <RelatedLinks links={related} />
    </section>
  )
}
