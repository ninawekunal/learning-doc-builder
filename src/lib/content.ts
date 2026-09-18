import { parseFrontmatter } from '@/lib/frontmatter'
import type { RelatedLink } from '@/lib/md/types'
import type { ContentEntry, ContentKind, QuizItem } from '@/lib/types'

// Each doc is a feature folder: content/docs/<slug>/index.md plus its images and downloads.
const docFiles = import.meta.glob('/content/docs/*/index.md', { query: '?raw', import: 'default', eager: true })
const docAssets = import.meta.glob<string>('/content/docs/*/**/*.{png,jpg,jpeg,gif,svg,webp,json,csv}', {
  query: '?url',
  import: 'default',
  eager: true,
})
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

/** Rewrites "./images/a.png" links in a doc folder to the bundled asset URL. */
const resolveAssets = (body: string, folder: string): string =>
  body.replace(/(\]\()\.\/([^)\s]+)/g, (whole, open: string, rel: string) => {
    const url = docAssets[`${folder}/${rel}`]

    return url ? `${open}${url}` : whole
  })

const slugOf = (path: string): string => {
  const parts = path.split('/')
  const file = parts.pop()!

  return file === 'index.md' ? parts.pop()! : file.replace(/\.md$/, '')
}

const build = (
  files: Record<string, unknown>,
  kind: ContentKind,
): ContentEntry[] =>
  Object.entries(files)
    .map(([path, raw]) => {
      const slug = slugOf(path)
      const parsed = parseFrontmatter(String(raw))
      const meta = parsed.meta
      const body = resolveAssets(parsed.body, path.slice(0, path.lastIndexOf('/')))
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

/** Every doc in the same series as `entry`, in part order. */
export const seriesParts = (entry: ContentEntry): ContentEntry[] =>
  entry.meta.series
    ? docs.filter((d) => d.meta.series === entry.meta.series).sort((a, b) => (a.meta.part ?? 0) - (b.meta.part ?? 0))
    : []
