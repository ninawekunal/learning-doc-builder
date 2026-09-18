import * as TabsPrimitive from '@radix-ui/react-tabs'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export const Tabs = TabsPrimitive.Root

export const TabsList = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List className={cn('flex min-w-0 gap-1 overflow-x-auto', className)} {...props} />
)

export const TabsTrigger = ({ className, ...props }: ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    className={cn(
      'cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-[12px] font-semibold text-[var(--text-muted)]',
      'hover:text-[var(--text)] data-[state=active]:bg-[var(--surface)] data-[state=active]:text-[var(--primary)]',
      'data-[state=active]:shadow-[0_0_0_1px_var(--border)]',
      className,
    )}
    {...props}
  />
)

export const TabsContent = TabsPrimitive.Content
