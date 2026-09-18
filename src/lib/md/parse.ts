import { Lexer } from 'marked'
import type { Token, Tokens } from 'marked'
import type { Block, CalloutType, CodeSpec, GlossaryTerm, ParsedDoc, Section, TermToken } from '@/lib/md/types'

export const CALLOUT_TYPES: CalloutType[] = [
  'TLDR',
  'TERMS',
  'ANALOGY',
  'STEPS',
  'NUANCE',
  'INTERVIEW',
  'GOTCHA',
  'WIN',
  'RECAP',
  'SUMMARY',
  'THINK',
]

/** Boxes that hold depth rather than the main thread start collapsed. */
const COLLAPSED_BY_DEFAULT = new Set<CalloutType>(['NUANCE', 'INTERVIEW', 'WIN'])

// breaks: a new line in the source is a new line on the page, so authors
// decide where a sentence starts on its own line.
const lex = (source: string): Token[] => Lexer.lex(source, { gfm: true, breaks: true })

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/&[a-z#0-9]+;/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)

/** Lifts `> [!TYPE]` blocks out of the source, leaving a placeholder line. */
const extractCallouts = (source: string): { source: string; bodies: { type: CalloutType; collapsed: boolean; body: string }[] } => {
  const lines = source.split(/\r?\n/)
  const out: string[] = []
  const bodies: { type: CalloutType; collapsed: boolean; body: string }[] = []

  let fence: string | null = null

  for (let i = 0; i < lines.length; i += 1) {
    // Callout markers inside a fenced code example are text, not callouts.
    const fenceMark = lines[i].match(/^(`{3,}|~{3,})/)

    if (fenceMark) {
      if (fence === null) fence = fenceMark[1]
      else if (fenceMark[1].startsWith(fence)) fence = null
    }

    const open = fence === null ? lines[i].match(/^>\s*\[!([A-Z]+)\]([+-])?\s*$/) : null

    if (!open || !CALLOUT_TYPES.includes(open[1] as CalloutType)) {
      out.push(lines[i])
      continue
    }

    const inner: string[] = []
    let j = i + 1

    while (j < lines.length && /^>/.test(lines[j])) {
      inner.push(lines[j].replace(/^>\s?/, ''))
      j += 1
    }

    const type = open[1] as CalloutType
    const collapsed = open[2] === '-' || (open[2] !== '+' && COLLAPSED_BY_DEFAULT.has(type))

    bodies.push({ type, collapsed, body: inner.join('\n') })
    out.push('', `<!--CALLOUT:${bodies.length - 1}-->`, '')
    i = j - 1
  }

  return { source: out.join('\n'), bodies }
}

const isImageOnly = (token: Tokens.Paragraph): Tokens.Image | null => {
  const inline = token.tokens.filter((t) => !(t.type === 'text' && t.raw.trim() === ''))

  return inline.length === 1 && inline[0].type === 'image' ? (inline[0] as Tokens.Image) : null
}

/** "tsx title=\"a.ts\" group=\"load\" tab=\"React Query\" open" -> a code spec. */
const parseCodeInfo = (code: Tokens.Code): CodeSpec => {
  const info = (code.lang ?? '').trim()
  const lang = info.split(/\s+/)[0] ?? ''
  const attr = (name: string): string | undefined => info.match(new RegExp(`${name}="([^"]*)"`))?.[1]

  return {
    lang: lang.includes('=') ? '' : lang,
    text: code.text,
    title: attr('title'),
    open: /(^|\s)open(\s|$)/.test(info.replace(/"[^"]*"/g, '""')),
    download: attr('download'),
    group: attr('group'),
    tab: attr('tab'),
  }
}

const toBlocks = (tokens: Token[], bodies: { type: CalloutType; collapsed: boolean; body: string }[]): Block[] => {
  const blocks: Block[] = []

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]

    if (token.type === 'space') continue

    if (token.type === 'html') {
      const placeholder = token.raw.match(/<!--CALLOUT:(\d+)-->/)

      if (placeholder) {
        const found = bodies[Number(placeholder[1])]

        if (found) blocks.push({
            kind: 'callout',
            type: found.type,
            collapsed: found.collapsed,
            blocks: toBlocks(lex(found.body), bodies),
          })
        continue
      }

      blocks.push({ kind: 'html', html: token.raw })
      continue
    }

    if (token.type === 'code') {
      const spec = parseCodeInfo(token as Tokens.Code)
      const previous = blocks[blocks.length - 1]

      if (spec.group && previous?.kind === 'tabs' && previous.group === spec.group) {
        previous.items.push(spec)
      } else if (spec.group) {
        blocks.push({ kind: 'tabs', group: spec.group, items: [spec] })
      } else {
        blocks.push({ kind: 'code', ...spec })
      }
      continue
    }

    if (token.type === 'table') {
      blocks.push({ kind: 'table', token: token as Tokens.Table, caption: null })
      continue
    }

    if (token.type === 'paragraph') {
      const paragraph = token as Tokens.Paragraph
      const image = isImageOnly(paragraph)

      if (image) {
        blocks.push({ kind: 'figure', src: image.href, alt: image.text, caption: image.title || image.text })
        continue
      }

      // "Table: how to read it" directly above a table becomes that table's caption.
      const caption = paragraph.text.match(/^Table:\s*(.+)$/s)
      let next = i + 1

      while (next < tokens.length && tokens[next].type === 'space') next += 1

      if (caption && tokens[next]?.type === 'table') {
        blocks.push({ kind: 'table', token: tokens[next] as Tokens.Table, caption: caption[1].trim() })
        i = next
        continue
      }
    }

    blocks.push({ kind: 'md', token })
  }

  return blocks
}

/** "**BFF (backend for frontend)** - a small server..." -> a glossary entry. */
const parseGlossary = (blocks: Block[]): GlossaryTerm[] => {
  const terms: GlossaryTerm[] = []

  for (const block of blocks) {
    if (block.kind !== 'md' || block.token.type !== 'list') continue

    for (const item of (block.token as Tokens.List).items) {
      const match = item.text.match(/^\*\*(.+?)\*\*\s*[-:]\s*([\s\S]+)$/)

      if (!match) continue

      const label = match[1].trim()
      const paren = label.match(/^(.*?)\s*\((.+)\)\s*$/)
      const base = paren ? paren[1] : label
      const keys = [...base.split(/\s*\/\s*/), ...(paren ? [paren[2]] : [])]
        .map((k) => k.replace(/`/g, '').trim())
        .filter((k) => k.length > 1)

      terms.push({ label, definition: match[2].replace(/\s+/g, ' ').trim(), keys })
    }
  }

  return terms
}

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isAcronym = (key: string): boolean => /^[A-Z0-9]{2,6}$/.test(key)

type MarkContext = { regex: RegExp; byKey: Map<string, GlossaryTerm>; seen: Set<GlossaryTerm> }

/** Splits one plain text run into text + term tokens, marking each term once per section. */
const splitText = (text: string, ctx: MarkContext): Token[] | null => {
  const parts: Token[] = []
  let last = 0

  ctx.regex.lastIndex = 0

  for (let m = ctx.regex.exec(text); m; m = ctx.regex.exec(text)) {
    const key = [...ctx.byKey.keys()].find((k) => k.toLowerCase() === m![1].toLowerCase())
    const term = key ? ctx.byKey.get(key) : undefined

    if (!term || !key || ctx.seen.has(term)) continue
    if (isAcronym(key) && m[1] !== key) continue

    if (m.index > last) parts.push({ type: 'text', raw: text.slice(last, m.index), text: text.slice(last, m.index) })

    const termToken: TermToken = { type: 'term', raw: m[0], text: m[0], term }

    parts.push(termToken as unknown as Token)
    ctx.seen.add(term)
    last = m.index + m[0].length
  }

  if (parts.length === 0) return null
  if (last < text.length) parts.push({ type: 'text', raw: text.slice(last), text: text.slice(last) })

  return parts
}

const SKIP_INLINE = new Set(['codespan', 'link', 'image', 'html', 'code'])

const markInline = (tokens: Token[], ctx: MarkContext): Token[] =>
  tokens.flatMap((token) => {
    if (SKIP_INLINE.has(token.type)) return [token]

    const withChildren = token as Token & { tokens?: Token[] }

    if (withChildren.tokens && withChildren.tokens.length > 0) {
      return [{ ...withChildren, tokens: markInline(withChildren.tokens, ctx) } as Token]
    }

    if (token.type === 'text') return splitText((token as Tokens.Text).text, ctx) ?? [token]

    return [token]
  })

const markBlockToken = (token: Token, ctx: MarkContext): Token => {
  if (token.type === 'heading') return token

  if (token.type === 'list') {
    const list = token as Tokens.List

    return { ...list, items: list.items.map((item) => ({ ...item, tokens: markInline(item.tokens, ctx) })) } as Token
  }

  const withChildren = token as Token & { tokens?: Token[] }

  return withChildren.tokens ? ({ ...withChildren, tokens: markInline(withChildren.tokens, ctx) } as Token) : token
}

const markBlocks = (blocks: Block[], ctx: MarkContext): Block[] =>
  blocks.map((block) => {
    if (block.kind === 'md') return { ...block, token: markBlockToken(block.token, ctx) }
    if (block.kind === 'callout' && block.type !== 'TERMS') return { ...block, blocks: markBlocks(block.blocks, ctx) }

    if (block.kind === 'table') {
      const t = block.token
      const cell = (c: Tokens.TableCell) => ({ ...c, tokens: markInline(c.tokens, ctx) })

      return { ...block, token: { ...t, header: t.header.map(cell), rows: t.rows.map((r) => r.map(cell)) } }
    }

    return block
  })

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1)

/** Drops the "Optional:" prefix from a heading's first text token; the page shows a badge instead. */
const stripOptional = (tokens: Token[]): Token[] =>
  tokens.map((t, i) =>
    i === 0 && t.type === 'text'
      ? ({ ...t, raw: capitalize(t.raw.replace(/^optional:\s*/i, '')), text: capitalize((t as Tokens.Text).text.replace(/^optional:\s*/i, '')) } as Token)
      : t,
  )

/** Markdown body -> numbered sections, a glossary, and term mentions marked once per section. */
export const parseDoc = (body: string): ParsedDoc => {
  const extracted = extractCallouts(body)
  const blocks = toBlocks(lex(extracted.source), extracted.bodies)

  const glossary = parseGlossary(
    blocks.flatMap((b) => (b.kind === 'callout' && b.type === 'TERMS' ? b.blocks : [])),
  )

  const preamble: Block[] = []
  const sections: Section[] = []
  const seenIds = new Set<string>()

  for (const block of blocks) {
    if (block.kind === 'md' && block.token.type === 'heading' && (block.token as Tokens.Heading).depth === 2) {
      const heading = block.token as Tokens.Heading
      let id = slugify(heading.text) || `section-${sections.length + 1}`

      while (seenIds.has(id)) id = `${id}-x`
      seenIds.add(id)
      const optional = /^optional:\s*/i.test(heading.text)
      const titleTokens = optional ? stripOptional(heading.tokens) : heading.tokens

      sections.push({
        id,
        title: capitalize(heading.text.replace(/^optional:\s*/i, '').replace(/[`*_]/g, '')),
        titleTokens,
        number: sections.length + 1,
        optional,
        blocks: [],
      })
      continue
    }

    if (block.kind === 'callout' && block.type === 'TERMS') continue

    const target = sections[sections.length - 1]

    if (target) target.blocks.push(block)
    else preamble.push(block)
  }

  if (glossary.length === 0) return { preamble, sections, glossary }

  const byKey = new Map<string, GlossaryTerm>()

  for (const term of glossary) for (const key of term.keys) byKey.set(key, term)

  const keys = [...byKey.keys()].sort((a, b) => b.length - a.length).map(escapeRegex)
  const regex = new RegExp(`(?<![\\w-])(${keys.join('|')})(?:e?s)?(?![\\w-])`, 'gi')

  return {
    preamble,
    glossary,
    sections: sections.map((section) => ({
      ...section,
      blocks: markBlocks(section.blocks, { regex, byKey, seen: new Set() }),
    })),
  }
}
