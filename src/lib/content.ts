import { parseFrontmatter } from '@/lib/frontmatter'
import type { RelatedLink } from '@/lib/md/types'
import type { ContentEntry, ContentKind, QuizItem } from '@/lib/types'

const docFiles = import.meta.glob('/content/docs/*.md', { query: '?raw', import: 'default', eager: true })
const blogFiles = import.meta.glob('/content/blog/*.md', { query: '?raw', import: 'default', eager: true })

/** Pulls a fenced JSON block (```quiz, ```related) out of the prose and parses it. */
const extractFence = <T,>(body: string, lang: string): { body: string; items: T[] } => {
  const match = body.match(new RegExp('```' + lang + '\\r?\\n([\\s\\S]*?)```'))

  if (!match) return { body, items: [] }

  let items: T[] = []

  try {
    const parsed: unknown = JSON.parse(match[1])

    if (Array.isArray(parsed)) items = parsed as T[]
  } catch {
    // A malformed block should not blank the doc. `pnpm check:content` catches it.
    items = []
  }

  return { body: body.replace(match[0], '').trim(), items }
}

const build = (
  files: Record<string, unknown>,
  kind: ContentKind,
): ContentEntry[] =>
  Object.entries(files)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()!.replace(/\.md$/, '')
      const { meta, body } = parseFrontmatter(String(raw))
      const quiz = extractFence<QuizItem>(body, 'quiz')
      const related = extractFence<RelatedLink>(quiz.body, 'related')

      return { kind, slug, meta, body: related.body, quiz: quiz.items, related: related.items }
    })
    .filter((entry) => !entry.meta.draft)
    // Newest first; parts of one series published the same day stay in order.
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date) || (a.meta.part ?? 0) - (b.meta.part ?? 0))

export const docs = build(docFiles, 'doc')
export const posts = build(blogFiles, 'blog')

export const allTags = (entries: ContentEntry[]): string[] =>
  [...new Set(entries.flatMap((e) => e.meta.tags))].sort()

export const findEntry = (kind: ContentKind, slug: string): ContentEntry | undefined =>
  (kind === 'doc' ? docs : posts).find((e) => e.slug === slug)
