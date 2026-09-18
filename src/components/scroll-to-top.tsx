import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Every route change starts at the top of the page, like a normal link would. */
export const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return null
}
