import * as PopoverPrimitive from '@radix-ui/react-popover'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'

export const Popover = PopoverPrimitive.Root
export const PopoverTrigger = PopoverPrimitive.Trigger

export const PopoverContent = ({
  className,
  align = 'center',
  sideOffset = 6,
  ...props
}: ComponentProps<typeof PopoverPrimitive.Content>) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      align={align}
      sideOffset={sideOffset}
      collisionPadding={12}
      className={cn(
        'z-50 w-72 max-w-[calc(100vw-24px)] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4',
        'text-[14px] leading-relaxed text-[var(--text)] shadow-[var(--shadow)] outline-none',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
)
