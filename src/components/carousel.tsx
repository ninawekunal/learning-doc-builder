import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

type CarouselProps = { children: ReactNode; className?: string };

/**
 * A horizontal, scroll-snap carousel. Arrow buttons appear only on the side that still has
 * more to show, so a track that already fits its container renders with no controls at all.
 * Touch and trackpad scrolling work with no JavaScript; the buttons are a shortcut on top.
 */
export const Carousel = ({ children, className }: CarouselProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  const updateEdges = useCallback(() => {
    const el = trackRef.current;

    if (!el) return;

    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    updateEdges();

    const onResize = () => updateEdges();

    window.addEventListener("resize", onResize);

    return () => window.removeEventListener("resize", onResize);
  }, [updateEdges, children]);

  const scrollByCard = (direction: 1 | -1) => {
    const el = trackRef.current;

    if (!el) return;

    const card = el.querySelector<HTMLElement>("[data-carousel-item]");
    const amount = (card?.offsetWidth ?? el.clientWidth * 0.8) + 16;

    el.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  return (
    <div className={cn("relative", className)}>
      <div
        ref={trackRef}
        onScroll={updateEdges}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>

      {!atStart && (
        <button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollByCard(-1)}
          className="absolute left-0 top-1/2 hidden size-9 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow)] transition-colors hover:bg-[var(--surface-2)] sm:flex"
        >
          <ChevronLeft className="size-4" aria-hidden />
        </button>
      )}
      {!atEnd && (
        <button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollByCard(1)}
          className="absolute right-0 top-1/2 hidden size-9 translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow)] transition-colors hover:bg-[var(--surface-2)] sm:flex"
        >
          <ChevronRight className="size-4" aria-hidden />
        </button>
      )}
    </div>
  );
};

export const CarouselItem = ({
  className,
  ...rest
}: { className?: string } & Record<string, unknown>) => (
  <div
    data-carousel-item
    className={cn("shrink-0 snap-start", className)}
    {...rest}
  />
);
