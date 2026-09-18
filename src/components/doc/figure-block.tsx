import { ImageIcon } from 'lucide-react'

type FigureBlockProps = { src: string; alt: string; caption: string }

/** An image with a plain-English caption underneath. */
export const FigureBlock = ({ src, alt, caption }: FigureBlockProps) => (
  <figure className="doc-figure">
    <img src={src} alt={alt} loading="lazy" />
    <figcaption>
      <ImageIcon className="size-3.5 shrink-0" aria-hidden />
      <span>{caption}</span>
    </figcaption>
  </figure>
)
