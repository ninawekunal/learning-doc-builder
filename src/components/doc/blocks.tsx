import type { Token, Tokens } from 'marked'
import { Fragment } from 'react'
import { Callout } from '@/components/doc/callout'
import { CodeBlock } from '@/components/doc/code-block'
import { CodeTabs } from '@/components/doc/code-tabs'
import { FigureBlock } from '@/components/doc/figure-block'
import { Inline, LineParagraph } from '@/components/doc/inline'
import { TableBlock } from '@/components/doc/table-block'
import type { Block } from '@/lib/md/types'

const ListItemBody = ({ tokens }: { tokens: Token[] }) => (
  <>
    {tokens.map((token, i) => {
      if (token.type === 'text') {
        const text = token as Tokens.Text

        return <Inline key={i} tokens={text.tokens ?? [text]} />
      }

      return <MdToken key={i} token={token} />
    })}
  </>
)

const MdToken = ({ token }: { token: Token }) => {
  switch (token.type) {
    case 'paragraph':
      return <LineParagraph tokens={(token as Tokens.Paragraph).tokens} />
    case 'heading': {
      const heading = token as Tokens.Heading
      const Tag = heading.depth <= 3 ? 'h3' : 'h4'

      return (
        <Tag>
          <Inline tokens={heading.tokens} />
        </Tag>
      )
    }
    case 'list': {
      const list = token as Tokens.List
      const items = list.items.map((item, i) => (
        <li key={i}>
          <ListItemBody tokens={item.tokens} />
        </li>
      ))

      return list.ordered ? <ol start={list.start || undefined}>{items}</ol> : <ul>{items}</ul>
    }
    case 'blockquote':
      return (
        <blockquote>
          {(token as Tokens.Blockquote).tokens.map((t, i) => (
            <MdToken key={i} token={t} />
          ))}
        </blockquote>
      )
    case 'hr':
      return <hr />
    case 'space':
      return null
    default:
      return <Fragment>{'text' in token ? String(token.text) : null}</Fragment>
  }
}

/** Renders the parsed block model: markdown, callouts, code, figures, tables and raw SVG. */
export const Blocks = ({ blocks }: { blocks: Block[] }) => (
  <>
    {blocks.map((block, i) => {
      switch (block.kind) {
        case 'callout':
          return (
            <Callout key={i} type={block.type} collapsed={block.collapsed}>
              <Blocks blocks={block.blocks} />
            </Callout>
          )
        case 'code':
          return <CodeBlock key={i} spec={block} />
        case 'tabs':
          return <CodeTabs key={i} items={block.items} />
        case 'figure':
          return <FigureBlock key={i} src={block.src} alt={block.alt} caption={block.caption} />
        case 'table':
          return <TableBlock key={i} token={block.token} caption={block.caption} />
        case 'html':
          return <div key={i} className="doc-html" dangerouslySetInnerHTML={{ __html: block.html }} />
        default:
          return <MdToken key={i} token={block.token} />
      }
    })}
  </>
)
