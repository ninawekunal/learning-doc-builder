import { useState } from 'react'
import { CodeActions, CodeBody, CodeFrame, lineCount } from '@/components/doc/code-block'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { CodeSpec } from '@/lib/md/types'

/** Two or more ways to write the same thing, one tab each, inside one collapsible block. */
export const CodeTabs = ({ items }: { items: CodeSpec[] }) => {
  const [tab, setTab] = useState('0')
  const current = items[Number(tab)] ?? items[0]

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <CodeFrame
        label={<span className="code-title">{current.title ?? 'Code'}</span>}
        defaultOpen={items.some((i) => i.open)}
        actions={<CodeActions spec={current} />}
        lines={Math.max(...items.map((i) => lineCount(i.text)))}
      >
        <TabsList className="code-tabs" aria-label="Versions of this code">
          {items.map((item, i) => (
            <TabsTrigger key={i} value={String(i)}>
              {item.tab ?? `Option ${i + 1}`}
            </TabsTrigger>
          ))}
        </TabsList>
        {items.map((item, i) => (
          <TabsContent key={i} value={String(i)}>
            <CodeBody spec={item} />
          </TabsContent>
        ))}
      </CodeFrame>
    </Tabs>
  )
}
