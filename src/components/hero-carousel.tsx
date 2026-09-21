import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type SVGProps,
} from "react";
import { cn } from "@/lib/cn";

export type HeroSlide = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  body: string;
};

const AUTOPLAY_MS = 6000;
const SWIPE_THRESHOLD = 40;

const usePrefersReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(query.matches);

    onChange();
    query.addEventListener("change", onChange);

    return () => query.removeEventListener("change", onChange);
  }, []);

  return reduced;
};

/**
 * One full-width slide at a time, sliding with a transform transition, with autoplay that
 * pauses on hover, focus and touch. Dots and arrows both move the same `index` state, so
 * every way of navigating stays in sync with the slide the screen reader announces.
 */
export const HeroCarousel = ({ slides }: { slides: readonly HeroSlide[] }) => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const touchStartX = useRef<number | null>(null);
  const count = slides.length;

  useEffect(() => {
    if (paused || reducedMotion || count <= 1) return;

    const id = setInterval(
      () => setIndex((current) => (current + 1) % count),
      AUTOPLAY_MS,
    );

    return () => clearInterval(id);
  }, [paused, reducedMotion, count]);

  const go = (next: number) => setIndex(((next % count) + count) % count);

  const onTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;

    const delta =
      (event.changedTouches[0]?.clientX ?? touchStartX.current) -
      touchStartX.current;

    if (Math.abs(delta) > SWIPE_THRESHOLD) go(index + (delta < 0 ? 1 : -1));
    touchStartX.current = null;
  };

  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className={cn(
          "flex",
          !reducedMotion && "transition-transform duration-500 ease-out",
        )}
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map(({ icon: Icon, title, body }, i) => (
          <div
            key={title}
            aria-hidden={i !== index}
            className="flex w-full shrink-0 flex-col items-center gap-4 px-6 py-16 text-center sm:px-20 sm:py-20"
          >
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
              <Icon className="size-7" aria-hidden />
            </span>
            <p className="m-0 max-w-[26ch] text-[22px] font-semibold tracking-tight sm:text-[28px]">
              {title}
            </p>
            <p className="m-0 max-w-[46ch] text-[15px] leading-relaxed text-[var(--text-muted)] sm:text-[16px]">
              {body}
            </p>
          </div>
        ))}
      </div>

      <p aria-live="polite" className="sr-only">
        {slides[index]?.title}
      </p>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous feature"
            onClick={() => go(index - 1)}
            className="absolute left-3 top-1/2 hidden size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow)] transition-colors hover:bg-[var(--surface-2)] sm:flex"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            aria-label="Next feature"
            onClick={() => go(index + 1)}
            className="absolute right-3 top-1/2 hidden size-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] shadow-[var(--shadow)] transition-colors hover:bg-[var(--surface-2)] sm:flex"
          >
            <ChevronRight className="size-4" aria-hidden />
          </button>
          <div
            role="tablist"
            aria-label="Features"
            className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-1.5"
          >
            {slides.map((slide, i) => (
              <button
                key={slide.title}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Show ${slide.title}`}
                onClick={() => go(i)}
                className={cn(
                  "h-1.5 cursor-pointer rounded-full transition-all",
                  i === index
                    ? "w-6 bg-[var(--primary)]"
                    : "w-1.5 bg-[var(--border)] hover:bg-[var(--text-muted)]",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
