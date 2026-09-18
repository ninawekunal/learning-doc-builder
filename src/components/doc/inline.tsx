import type { Token, Tokens } from 'marked'
import { Fragment } from 'react'
import { BionicText } from '@/components/bionic-text'
import { useDocContext } from '@/components/doc/doc-context'
import { TermMention } from '@/components/doc/term-mention'
import type { TermToken } from '@/lib/md/types'

const decode = (text: string): string =>
  text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')

const Text = ({ text }: { text: string }) => {
  const { bionic } = useDocContext()

  return <BionicText text={decode(text)} on={bionic} />
}

/** Renders marked's inline tokens as React, so terms, bionic and links are real components. */
export const Inline = ({ tokens }: { tokens: Token[] }) => (
  <>
    {tokens.map((token, i) => {
      switch (token.type) {
        case 'term': {
          const term = token as unknown as TermToken

          return (
            <TermMention key={i} term={term.term}>
              <Text text={term.text} />
            </TermMention>
          )
        }
        case 'strong':
          return (
            <strong key={i}>
              <Inline tokens={(token as Tokens.Strong).tokens} />
            </strong>
          )
        case 'em':
          return (
            <em key={i}>
              <Inline tokens={(token as Tokens.Em).tokens} />
            </em>
          )
        case 'del':
          return (
            <del key={i}>
              <Inline tokens={(token as Tokens.Del).tokens} />
            </del>
          )
        case 'codespan':
          return <code key={i}>{decode((token as Tokens.Codespan).text)}</code>
        case 'br':
          return <br key={i} />
        case 'link': {
          const link = token as Tokens.Link
          const external = /^https?:/.test(link.href)

          return (
            <a key={i} href={link.href} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
              <Inline tokens={link.tokens} />
            </a>
          )
        }
        case 'image': {
          const image = token as Tokens.Image

          return <img key={i} src={image.href} alt={image.text} loading="lazy" />
        }
        case 'escape':
          return <Fragment key={i}>{(token as Tokens.Escape).text}</Fragment>
        case 'text': {
          const text = token as Tokens.Text

          return text.tokens && text.tokens.length > 0 ? (
            <Inline key={i} tokens={text.tokens} />
          ) : (
            <Text key={i} text={text.text} />
          )
        }
        default:
          return <Fragment key={i}>{'text' in token ? decode(String(token.text)) : token.raw}</Fragment>
      }
    })}
  </>
)

/**
 * A paragraph whose source lines each start on their own visual line, with a
 * little air between them - the "new sentence, new line" reading rhythm.
 */
export const LineParagraph = ({ tokens }: { tokens: Token[] }) => {
  const lines: Token[][] = [[]]

  for (const token of tokens) {
    if (token.type === 'br') lines.push([])
    else lines[lines.length - 1].push(token)
  }

  return (
    <p>
      {lines.map((line, i) => (
        <span key={i} className="line">
          <Inline tokens={line} />
        </span>
      ))}
    </p>
  )
}
