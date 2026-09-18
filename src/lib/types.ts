import type { RelatedLink } from '@/lib/md/types'

export type QuizItem = {
  q: string
  options: string[]
  /** 0-based index, or an array of indices for a select-all item. */
  answer: number | number[]
  multi?: boolean
  expl: string
}

export type ContentKind = 'doc' | 'blog'

export type Frontmatter = {
  title: string
  summary: string
  date: string
  tags: string[]
  minutes?: number
  /** Series position; docs with a part sort by it ascending. */
  part?: number
  /** Series name; docs sharing it get previous / next links. */
  series?: string
  draft?: boolean
  /** Reachable by URL only: never listed, linked, tagged or shown in series navigation. */
  unlisted?: boolean
}

export type Heading = { id: string; text: string; level: 2 | 3; optional?: boolean }

export type ContentEntry = {
  kind: ContentKind
  slug: string
  meta: Frontmatter
  /** Prose markdown with the quiz block stripped out. */
  body: string
  quiz: QuizItem[]
  related: RelatedLink[]
}
