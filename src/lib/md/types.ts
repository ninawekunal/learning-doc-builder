import type { Token, Tokens } from 'marked'

export type CalloutType =
  | 'TLDR'
  | 'TERMS'
  | 'ANALOGY'
  | 'STEPS'
  | 'NUANCE'
  | 'INTERVIEW'
  | 'GOTCHA'
  | 'WIN'
  | 'RECAP'
  | 'SUMMARY'
  | 'THINK'

export type GlossaryTerm = {
  /** The label as written, e.g. "BFF (backend for frontend)". */
  label: string
  definition: string
  /** Words that count as a mention in the prose, e.g. ["BFF", "backend for frontend"]. */
  keys: string[]
}

/** An inline text token rewritten to carry a glossary mention. */
export type TermToken = { type: 'term'; raw: string; text: string; term: GlossaryTerm }

export type Block =
  | { kind: 'md'; token: Token }
  | { kind: 'callout'; type: CalloutType; collapsed: boolean; title?: string; blocks: Block[] }
  | ({ kind: 'code' } & CodeSpec)
  | { kind: 'tabs'; group: string; items: CodeSpec[] }
  | { kind: 'table'; token: Tokens.Table; caption: string | null }
  | { kind: 'figure'; src: string; alt: string; caption: string }
  | { kind: 'html'; html: string }

/** A fenced code block plus the attributes written after its language. */
export type CodeSpec = {
  lang: string
  text: string
  /** File name for the header, from `title="columns.tsx"`. */
  title?: string
  /** Starts expanded; every code block is collapsed unless it says `open`. */
  open: boolean
  /** Adds a Download button that saves the code under this file name. */
  download?: string
  /** Consecutive blocks sharing a group render as one tabbed block. */
  group?: string
  tab?: string
}

export type Section = {
  id: string
  title: string
  /** Inline tokens of the heading, for bold or code inside it. */
  titleTokens: Token[]
  number: number
  /** "## Optional: ..." sections render collapsed. */
  optional: boolean
  blocks: Block[]
}

export type RelatedLink = {
  title: string
  url: string
  source: string
  kind: 'practice' | 'read' | 'watch'
  note: string
  difficulty?: string
}

export type ParsedDoc = {
  preamble: Block[]
  sections: Section[]
  glossary: GlossaryTerm[]
}
