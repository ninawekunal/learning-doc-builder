import {
  BookOpen,
  Brain,
  ChevronDown,
  ClipboardList,
  Lightbulb,
  ListOrdered,
  MessagesSquare,
  Pin,
  Scale,
  Sparkles,
  TriangleAlert,
  Trophy,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/cn'
import type { CalloutType } from '@/lib/md/types'

type CalloutStyle = { label: string; icon: LucideIcon; tone: string }

export const CALLOUT_STYLES: Record<CalloutType, CalloutStyle> = {
  TLDR: { label: 'TL;DR', icon: Sparkles, tone: 'callout-tldr' },
  TERMS: { label: 'Words you will meet', icon: BookOpen, tone: 'callout-terms' },
  ANALOGY: { label: 'Think of it like this', icon: Lightbulb, tone: 'callout-analogy' },
  STEPS: { label: 'Steps', icon: ListOrdered, tone: 'callout-steps' },
  NUANCE: { label: 'Nuances', icon: Scale, tone: 'callout-nuance' },
  INTERVIEW: { label: 'Interview must-know', icon: MessagesSquare, tone: 'callout-interview' },
  GOTCHA: { label: 'Gotcha', icon: TriangleAlert, tone: 'callout-gotcha' },
  WIN: { label: 'The win', icon: Trophy, tone: 'callout-win' },
  RECAP: { label: 'Remember from this section', icon: Pin, tone: 'callout-recap' },
  SUMMARY: { label: 'Summary', icon: ClipboardList, tone: 'callout-summary' },
  THINK: { label: 'Think before you peek', icon: Brain, tone: 'callout-think' },
}

type CalloutProps = { type: CalloutType; collapsed: boolean; children: ReactNode }

/** Every callout is a collapsible box with a coloured icon; depth boxes start closed. */
export const Callout = ({ type, collapsed, children }: CalloutProps) => {
  const [open, setOpen] = useState(!collapsed)
  const style = CALLOUT_STYLES[type]
  const Icon = style.icon

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn('callout', style.tone)}>
      <CollapsibleTrigger className="callout-trigger">
        <span className="callout-icon" aria-hidden>
          <Icon className="size-4" />
        </span>
        <span className="callout-label">{style.label}</span>
        <ChevronDown className={cn('callout-chevron size-4', !open && '-rotate-90')} aria-hidden />
      </CollapsibleTrigger>
      <CollapsibleContent className="callout-body">{children}</CollapsibleContent>
    </Collapsible>
  )
}
