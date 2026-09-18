import { useEffect } from 'react'
import { site } from '@/site'

/** Sets the browser tab to the article's name while it is open; unlisted docs also ask search engines to skip them. */
export const useDocTitle = (title: string, noindex = false): void => {
  useEffect(() => {
    const previous = document.title
    const robots = noindex ? document.createElement('meta') : null

    document.title = `${title} · ${site.title}`

    if (robots) {
      robots.name = 'robots'
      robots.content = 'noindex, nofollow'
      document.head.appendChild(robots)
    }

    return () => {
      document.title = previous
      robots?.remove()
    }
  }, [title, noindex])
}
