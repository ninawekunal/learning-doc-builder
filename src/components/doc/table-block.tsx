import type { Tokens } from 'marked'
import { Table2 } from 'lucide-react'
import { Inline } from '@/components/doc/inline'

type TableBlockProps = { token: Tokens.Table; caption: string | null }

/** A table with a "how to read this table" line above it. */
export const TableBlock = ({ token, caption }: TableBlockProps) => (
  <figure className="doc-table">
    {caption && (
      <figcaption>
        <Table2 className="size-3.5 shrink-0" aria-hidden />
        <span>
          <strong>How to read this table: </strong>
          {caption}
        </span>
      </figcaption>
    )}
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {token.header.map((cell, i) => (
              <th key={i} style={{ textAlign: token.align[i] ?? undefined }}>
                <Inline tokens={cell.tokens} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, r) => (
            <tr key={r}>
              {row.map((cell, c) => (
                <td key={c} style={{ textAlign: token.align[c] ?? undefined }}>
                  <Inline tokens={cell.tokens} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </figure>
)
