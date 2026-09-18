import { useEffect } from 'react'
import { site } from '@/site'

/** Sets the browser tab to the article's name while it is open. */
export const useDocTitle = (title: string): void => {
  useEffect(() => {
    const previous = document.title

    document.title = `${title} · ${site.title}`

    return () => {
      document.title = previous
    }
  }, [title])
}
