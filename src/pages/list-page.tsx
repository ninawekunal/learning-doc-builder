import { Check, ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { EntryCard } from "@/components/entry-card";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/cn";
import { allTopics } from "@/lib/content";
import type { ContentEntry } from "@/lib/types";

type ListPageProps = {
  title: string;
  blurb: string;
  entries: ContentEntry[];
  topical?: boolean;
};

type SortKey = "newest" | "oldest" | "title";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "title", label: "Title, A to Z" },
];

const PAGE_SIZE = 6;

const sortEntries = (
  entries: ContentEntry[],
  sort: SortKey,
): ContentEntry[] => {
  const copy = [...entries];

  if (sort === "oldest")
    copy.sort((a, b) => a.meta.date.localeCompare(b.meta.date));
  if (sort === "title")
    copy.sort((a, b) => a.meta.title.localeCompare(b.meta.title));

  // 'newest' needs no work: entries already arrive newest-first from content.ts.
  return copy;
};

/** A small labelled dropdown built on the shared Popover, matching the series picker's look. */
const FilterMenu = ({
  label,
  activeLabel,
  options,
  value,
  onChange,
}: {
  label: string;
  activeLabel: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (key: string) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-[13px] font-medium text-[var(--text)] transition-colors hover:bg-[var(--surface-2)]"
        >
          <span className="text-[var(--text-muted)]">{label}:</span>
          {activeLabel}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-56 p-1.5">
        <ul className="m-0 list-none p-0">
          {options.map((option) => {
            const active = option.key === value;

            return (
              <li key={option.key}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.key);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px]",
                    active
                      ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                      : "hover:bg-[var(--surface-2)]",
                  )}
                >
                  {option.label}
                  {active && (
                    <Check className="size-3.5 shrink-0" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
};

const EntryGrid = ({ entries }: { entries: ContentEntry[] }) => (
  <div className="grid gap-4 sm:grid-cols-2">
    {entries.map((entry) => (
      <EntryCard key={entry.slug} entry={entry} />
    ))}
  </div>
);

/** One topic's own section: a heading, a grid capped at PAGE_SIZE, and a Show more of its own. */
const TopicSection = ({
  topic,
  entries,
}: {
  topic: string;
  entries: ContentEntry[];
}) => {
  const [count, setCount] = useState(PAGE_SIZE);
  const shown = entries.slice(0, count);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{topic}</h2>
        <p className="m-0 text-[13px] text-[var(--text-muted)]">
          {entries.length} {entries.length === 1 ? "doc" : "docs"}
        </p>
      </div>
      <div className="mt-4">
        <EntryGrid entries={shown} />
      </div>
      {count < entries.length && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setCount((c) => c + PAGE_SIZE)}
          >
            Show more ({entries.length - count} left)
          </Button>
        </div>
      )}
    </section>
  );
};

/**
 * With no search or topic picked, entries are grouped into their own topic sections, each
 * capped and independently expandable, so a big library never dumps every doc on one screen.
 * Picking a topic or typing a search flattens the page into one sorted, filtered grid.
 */
export const ListPage = ({
  title,
  blurb,
  entries,
  topical = false,
}: ListPageProps) => {
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");
  const [flatCount, setFlatCount] = useState(PAGE_SIZE);

  const topics = useMemo(
    () => (topical ? allTopics(entries) : []),
    [entries, topical],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return entries.filter((e) => {
      if (topic && e.meta.topic !== topic) return false;
      if (!q) return true;

      return (
        e.meta.title.toLowerCase().includes(q) ||
        e.meta.summary.toLowerCase().includes(q) ||
        e.meta.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [entries, topic, query]);

  const sorted = useMemo(() => sortEntries(filtered, sort), [filtered, sort]);
  const isFlat = !topical || topic !== null || query.trim() !== "";
  const grouped = useMemo(() => {
    if (isFlat) return [];

    return topics
      .map((t) => ({
        topic: t,
        entries: sorted.filter((e) => e.meta.topic === t),
      }))
      .filter((g) => g.entries.length > 0);
  }, [isFlat, topics, sorted]);

  const clearFilters = () => {
    setQuery("");
    setTopic(null);
  };

  return (
    <div>
      <h1 className="text-[28px] font-semibold tracking-tight">{title}</h1>
      <p className="mt-1.5 max-w-[62ch] text-[var(--text-muted)]">{blurb}</p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <label className="relative order-first basis-full sm:order-none sm:basis-auto sm:flex-1 sm:max-w-xs">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--text-muted)]"
            aria-hidden
          />
          <span className="sr-only">Search {title.toLowerCase()}</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, summary or tag"
            type="search"
            className="h-9 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-8 pr-3 text-[13px] text-[var(--text)] placeholder:text-[var(--text-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
          />
        </label>

        {topical && topics.length > 1 && (
          <FilterMenu
            label="Topic"
            activeLabel={topic ?? "All"}
            value={topic ?? "all"}
            onChange={(key) => setTopic(key === "all" ? null : key)}
            options={[
              { key: "all", label: "All topics" },
              ...topics.map((t) => ({ key: t, label: t })),
            ]}
          />
        )}

        <FilterMenu
          label="Sort"
          activeLabel={SORTS.find((s) => s.key === sort)!.label}
          value={sort}
          onChange={(key) => setSort(key as SortKey)}
          options={SORTS.map((s) => ({ key: s.key, label: s.label }))}
        />

        {(query || topic) && (
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="size-3.5" />}
            onClick={clearFilters}
          >
            Clear
          </Button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-10 text-[var(--text-muted)]">
          {entries.length === 0
            ? "Nothing here yet."
            : "Nothing matches those filters."}
        </p>
      ) : isFlat ? (
        <div className="mt-8">
          <EntryGrid entries={sorted.slice(0, flatCount)} />
          {flatCount < sorted.length && (
            <div className="mt-4 flex justify-center">
              <Button
                variant="outline"
                onClick={() => setFlatCount((c) => c + PAGE_SIZE)}
              >
                Show more ({sorted.length - flatCount} left)
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {grouped.map((section) => (
            <TopicSection
              key={section.topic}
              topic={section.topic}
              entries={section.entries}
            />
          ))}
        </div>
      )}
    </div>
  );
};
