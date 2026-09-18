import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'

/** Floating arrow that appears once you are a screen or two down, and jumps back to the top. */
export const BackToTop = ({ stacked }: { stacked: boolean }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 1.2)

    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className={cn('top-fab', stacked && 'top-fab-stacked', visible ? 'top-fab-visible' : 'pointer-events-none')}
      tabIndex={visible ? 0 : -1}
    >
      <ArrowUp className="size-5" aria-hidden />
    </button>
  )
}
