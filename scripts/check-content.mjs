#!/usr/bin/env node
/**
 * Validates every content file before it ships: front matter, quiz JSON,
 * answer ranges, and the house style rules the renderer cannot enforce.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const DIRS = ['content/docs', 'content/blog']
const REQUIRED = ['title', 'summary', 'date', 'tags']

const problems = []
const warnings = []
const slugs = new Map()

const fail = (file, message) => problems.push(`${file}: ${message}`)
const warn = (file, message) => warnings.push(`${file}: ${message}`)

const readFrontmatter = (source) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)

  if (!match) return null

  const fields = {}

  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w-]*):\s*(.*)$/)

    if (kv) fields[kv[1]] = kv[2].trim()
  }

  return fields
}

const checkQuiz = (file, source, isDoc) => {
  const match = source.match(/```quiz\r?\n([\s\S]*?)```/)

  if (!match) {
    if (isDoc) warn(file, 'no quiz block (docs should normally have one)')

    return
  }

  let quiz

  try {
    quiz = JSON.parse(match[1])
  } catch (error) {
    fail(file, `quiz block is not valid JSON: ${error.message}`)

    return
  }

  if (!Array.isArray(quiz)) {
    fail(file, 'quiz block must be a JSON array')

    return
  }

  if (isDoc && (quiz.length < 5 || quiz.length > 8)) {
    warn(file, `${quiz.length} questions (the rubric asks for 5 to 8)`)
  }

  let multis = 0
  const indexCounts = [0, 0, 0, 0]

  quiz.forEach((item, i) => {
    const at = `${file} q${i + 1}`

    if (typeof item.q !== 'string' || item.q.length === 0) fail(at, 'missing q')
    if (!Array.isArray(item.options) || item.options.length !== 4) fail(at, 'needs exactly 4 options')
    if (typeof item.expl !== 'string' || item.expl.length === 0) fail(at, 'missing expl')

    const answers = Array.isArray(item.answer) ? item.answer : [item.answer]

    if (answers.length === 0) fail(at, 'missing answer')

    for (const a of answers) {
      if (!Number.isInteger(a) || a < 0 || a > 3) fail(at, `answer index ${a} out of range`)
    }

    if (Array.isArray(item.answer)) {
      multis += 1
      if (item.multi !== true) warn(at, 'array answer should set "multi": true')
    } else {
      indexCounts[item.answer] += 1
    }

    const lengths = (item.options ?? []).map((o) => String(o).split(/\s+/).length)
    const longest = Math.max(...lengths)

    if (!Array.isArray(item.answer) && lengths[item.answer] === longest && longest > Math.min(...lengths) + 3) {
      warn(at, 'correct option is the longest by more than 3 words')
    }
  })

  if (isDoc && multis < 1) warn(file, `${multis} select-all items (the rubric asks for 1 to 2)`)
  if (isDoc && indexCounts.some((n) => n === 0) && quiz.length >= 8) {
    warn(file, `correct-answer indices are clustered: ${indexCounts.join('/')}`)
  }
}

const MAX_SECTIONS = 5
const RELATED_KINDS = ['practice', 'read', 'watch']

const isProseLine = (line) => {
  const text = line.replace(/^>\s?/, '').trim()

  return /^[A-Za-z*_`"(]/.test(text) && !/^([-*]|\d+\.)\s/.test(text) && !text.startsWith('[!')
}

/** Relative links and images must point at a file inside the doc's own folder. */
const checkAssets = (file, body) => {
  const folder = file.slice(0, file.lastIndexOf('/'))

  for (const m of body.matchAll(/\]\(\.\/([^)\s]+)/g)) {
    if (!existsSync(join(folder, m[1]))) fail(file, `./${m[1]} does not exist in the doc folder`)
  }
  for (const m of body.matchAll(/\]\((?:\/)?images\/[^)\s]+/g)) fail(file, `${m[0].slice(2)} must be ./images/... inside the doc folder`)
}

/** The house reading rules: recaps, a summary, captioned tables and images, glossary, links. */
const checkReadability = (file, body) => {
  const prose = body.split(/```quiz/)[0]
  const sections = prose.split(/^(?=## )/m).filter((s) => s.startsWith('## '))

  if (!/> \[!TERMS\]/.test(prose)) warn(file, 'no > [!TERMS] box (the floating Words-you-will-meet list is empty)')

  const counted = sections.filter((s) => !/^## Summary\s*$/m.test(s))

  if (counted.length > MAX_SECTIONS) {
    fail(file, `${counted.length} sections before the Summary (max ${MAX_SECTIONS}); split it into two articles in the series`)
  }

  const summary = sections.find((s) => /^## Summary\s*$/m.test(s))

  if (!summary || !/> \[!SUMMARY\]/.test(summary)) fail(file, 'needs a closing "## Summary" section with a > [!SUMMARY] box')

  for (const section of sections) {
    const title = section.split('\n')[0].slice(3).trim()

    if (title === 'Summary') continue
    if (!/> \[!RECAP\]/.test(section)) fail(file, `section "${title}" has no > [!RECAP] box`)
  }

  const lines = prose.split('\n')
  let inFence = false

  lines.forEach((line, i) => {
    if (/^(```|~~~)/.test(line)) {
      inFence = !inFence

      return
    }
    if (inFence) return

    const prev = lines[i - 1] ?? ''

    if (line.startsWith('|') && !prev.startsWith('|')) {
      const before = lines.slice(Math.max(0, i - 2), i).join('\n')

      if (!/^Table: .+/m.test(before)) fail(file, `table at line ${i + 1} has no "Table:" caption line above it`)
    }

    for (const m of line.matchAll(/!\[[^\]]*\]\((\S+?)(\s+"[^"]+")?\)/g)) {
      if (!m[2]) fail(file, `image ${m[1]} has no "caption" title`)
    }

    // A prose line that stops mid-sentence and carries on below renders as a broken line.
    const next = lines[i + 1] ?? ''
    const text = line.replace(/^>\s?/, '').trim()
    const nextText = next.replace(/^>\s?/, '').trim()

    if (isProseLine(line) && isProseLine(next) && !/[.!?:;)"'`*]$/.test(text) && /^[a-z]/.test(nextText)) {
      warn(file, `line ${i + 1} breaks mid-sentence; keep one sentence per line`)
    }
  })

  const related = body.match(/```related\r?\n([\s\S]*?)```/)

  if (!related) {
    warn(file, 'no ```related block (practice and further reading)')

    return
  }

  try {
    const links = JSON.parse(related[1])

    links.forEach((l, i) => {
      for (const key of ['title', 'url', 'source', 'kind', 'note']) if (!l[key]) fail(file, `related[${i}] missing ${key}`)
      if (l.kind && !RELATED_KINDS.includes(l.kind)) fail(file, `related[${i}] kind must be one of ${RELATED_KINDS.join(', ')}`)
    })
  } catch (error) {
    fail(file, `related block is not valid JSON: ${error.message}`)
  }
}

for (const dir of DIRS) {
  let files = []

  try {
    // Docs are feature folders (<slug>/index.md); blog posts are flat files.
    files = readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      if (entry.isDirectory()) {
        const index = join(dir, entry.name, 'index.md')

        return existsSync(index) ? [{ file: index, slug: entry.name }] : []
      }

      if (dir === 'content/docs' && entry.name.endsWith('.md')) {
        fail(join(dir, entry.name), 'docs must live in their own folder: content/docs/<slug>/index.md')

        return []
      }

      return entry.name.endsWith('.md') ? [{ file: join(dir, entry.name), slug: entry.name.replace(/\.md$/, '') }] : []
    })
  } catch {
    continue
  }

  for (const { file, slug } of files) {
    const source = readFileSync(file, 'utf8')

    if (slugs.has(slug)) fail(file, `duplicate slug, also in ${slugs.get(slug)}`)
    slugs.set(slug, file)

    const meta = readFrontmatter(source)

    if (!meta) {
      fail(file, 'missing front matter')
      continue
    }

    for (const key of REQUIRED) {
      if (!meta[key]) fail(file, `front matter is missing "${key}"`)
    }

    if (meta.date && !/^\d{4}-\d{2}-\d{2}$/.test(meta.date)) fail(file, 'date must be YYYY-MM-DD')

    const body = source.slice(source.indexOf('---', 3) + 3)
    const sections = body.match(/^## .+$/gm) ?? []

    if (dir === 'content/docs' && sections.length < 3) warn(file, `${sections.length} sections (aim for 4 or 5 plus Summary)`)

    const gotchas = (body.match(/> \[!GOTCHA\]/g) ?? []).length

    if (gotchas > 1) warn(file, `${gotchas} gotcha callouts (spend it once)`)

    const badCallout = body.match(/> \[!([A-Z]+)\][+-]?/g)?.find(
      (m) =>
        !['TLDR', 'TERMS', 'ANALOGY', 'STEPS', 'NUANCE', 'INTERVIEW', 'GOTCHA', 'WIN', 'RECAP', 'SUMMARY', 'THINK'].includes(
          m.replace(/[+-]$/, '').slice(4, -1),
        ),
    )

    if (badCallout) fail(file, `unknown callout ${badCallout}`)

    if (source.includes('\u2014')) fail(file, 'contains an em dash')

    if (dir === 'content/docs') {
      checkReadability(file, body)
      checkAssets(file, body)
      if (meta.series && !meta.part) fail(file, 'a doc in a series needs a "part"')
    }

    checkQuiz(file, source, dir === 'content/docs')
  }
}

for (const line of warnings) console.warn(`warn  ${line}`)
for (const line of problems) console.error(`ERROR ${line}`)

console.log(
  `\nchecked ${slugs.size} file(s): ${problems.length} error(s), ${warnings.length} warning(s)`,
)

process.exit(problems.length > 0 ? 1 : 0)
