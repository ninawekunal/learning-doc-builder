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
  | { kind: 'callout'; type: CalloutType; blocks: Block[] }
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'table'; token: Tokens.Table; caption: string | null }
  | { kind: 'figure'; src: string; alt: string; caption: string }
  | { kind: 'html'; html: string }

export type Section = {
  id: string
  title: string
  /** Inline tokens of the heading, for bold or code inside it. */
  titleTokens: Token[]
  number: number
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
