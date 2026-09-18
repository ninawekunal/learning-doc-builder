---
title: Header filters - ranges, dates and the URL
summary: Long option lists, number ranges, dates, and one filter object that feeds headers, chips, the URL and the server.
date: 2026-09-17
part: 6
series: Data Tables in React
tags: [filters, url-state, dates]
minutes: 10
---

> [!TERMS]
>
> - **Option list** - the values a filter popover lets you tick, like every symbol.
> - **Chips** - small removable tags under the toolbar, one per active filter.
> - **Serializer** - a function that turns an object into text, here the `?key=value` part of a URL.
> - **Schema** - a description of valid data that also checks and cleans input, like a zod schema.
> - **ISO date** - a date written as `2026-09-17`, year first.
> - **UTC** - the world's reference clock, which is hours ahead of New York.
> - **Hydration** - the browser taking over server-rendered HTML; both must render the same thing.

## The big picture

> [!TLDR]
> [Part 5](#/docs/header-filters-popover) built one header filter: a typed filter object, a title that opens a popover, and a draft that applies once.
> This part scales it: long lists, ranges, dates, and one filter object shared by every surface and the URL.

Table: each row is a place in the UI, what it reads from the filter object, and what it may change.

| Place                     | Reads                              | Changes               |
| ------------------------- | ---------------------------------- | --------------------- |
| Header popovers           | Its own filter key                 | Its own key, on Apply |
| "All filters" panel       | A draft copy of everything         | Everything, on Apply  |
| Chips row                 | Every active filter                | Removes one value     |
| URL, data request, export | Everything, through one serializer | -                     |

> [!ANALOGY]
> The filter object is the single scoreboard in a stadium.
> Every screen around the ground shows it; nobody keeps their own tally.

> [!RECAP]
>
> - Every surface reads one filter object.
> - Only headers, the panel and chips may change it.

## Long option lists

> [!TLDR]
> Long lists load from the server the first time a popover opens.
> They come from **all** the user's data, not the filtered rows.

If options came from the filtered rows, picking one symbol would leave only that symbol to pick.

> [!THINK]
> When should the options request fire, and what should its query key depend on?
> Hint: not on the current filters.

```ts title="use-symbol-options.ts"
export const useSymbolOptions = (open: boolean) =>
  useQuery({
    queryKey: ["orders", "symbol-options"], // no filters: the whole baseline
    queryFn: fetchSymbolOptions,
    enabled: open, // first open only, then cached
    staleTime: 5 * 60_000,
  });
```

![Symbol popover where already-applied symbols are listed first, above the rest of the options](./images/symbol-popover-selected-first.png "Symbols you already applied sit at the top of the list.")

> [!NUANCE]-
>
> - Put already-applied items at the top, using the applied value, not the draft, or rows jump under the cursor as you tick.
> - Let "nvidia" find `NVDA` by giving each option extra search words.
> - If the options fail to load, say so and offer a retry. An empty list means "nothing exists", which is a different fact.

> [!RECAP]
>
> - Load long option lists on first open, from all the user's data.
> - Sort selected-first by the applied value, not the draft.

## Number ranges and dates

> [!TLDR]
> Number ranges keep what was typed as text until Apply.
> Dates only become `Date` objects inside the calendar.

A half-typed number like "1e" is not a number yet.
Store a number and the input snaps back to empty mid-keystroke.

> [!THINK]
> What does the draft hold while the user types, and where does parsing happen?

```ts title="quantity-range-draft.ts"
const [minText, setMinText] = useState(applied.min?.toString() ?? "");
const min = minText === "" ? null : Number(minText); // derived each render
const error = min !== null && Number.isNaN(min) ? "Enter a number" : null;
```

![Quantity popover with minimum and maximum inputs, a validation message, and the Clear and Apply footer](./images/quantity-range-popover.png "The quantity range: two text boxes, checked on every render, applied once.")

> [!GOTCHA]
> `new Date("2026-09-17")` means midnight in **UTC**, which is still the evening of the 16th in New York.
> So the calendar highlights the wrong day for American users.
> Build dates from year, month and day in local time, store plain `2026-09-17` text, and let the server decide when a trading day starts.

> [!THINK]
> Given "2026-09-17", how do you get a local-midnight Date without the UTC trap?

```ts title="iso-date.ts"
export const fromIsoDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);

  return new Date(y, m - 1, d); // local midnight
};
```

![Submitted popover with Today and This week presets above a range calendar, three days selected, and the Clear and Apply footer](./images/date-range-popover.png "The date filter: Today and This week shortcuts above a calendar with three days picked.")

> [!NUANCE]-
> Work out "Today" and "This week" only inside the click handler.
> Reading the clock during render makes the server and browser disagree, which breaks hydration.

> [!RECAP]
>
> - Keep half-typed numbers as text and parse on render.
> - Never turn a date string into a Date outside the calendar.

## One object, many places

> [!TLDR]
> The usual bug is two places disagreeing: a chip says one thing and a header badge another.
> The fix is to have only one copy, so there is nothing to keep in sync.

![The page owns one OrderFilters object that header popovers, the All filters panel and the chips row read and write, and one serializer turns it into the URL, the list request, the CSV link and the query key](./images/one-filter-object.png "The page owns one filter object; headers, the panel and chips all read and write it, and it becomes the URL.")

> [!STEPS]
>
> 1. **The page owns the object** and shares it, plus one `updateFilters` function, with everything below it.
> 2. **`updateFilters` also resets to page 1**, because page 7 of the full list does not exist in a list of 12.
> 3. **Chips are worked out from the object**, each knowing how to remove only its own value.
> 4. **The "All filters" panel keeps its own draft** too, applied once.

> [!NUANCE]-
> Share the object through React context rather than rebuilding the columns with it.
> Rebuilt columns make every header restart, closing any open popover.

![Blotter with Symbol, Status and Quantity badges active, the matching chips row, and the All filters sheet open showing the same symbols, status and minimum quantity](./images/all-filters-panel.png "The All filters panel open, showing the same choices as the header badges and chips.")

> [!RECAP]
>
> - One copy of the filters means nothing can disagree.
> - updateFilters also resets to page 1.

## Into the URL and to the server

> [!TLDR]
> One function writes the filters into the URL; one schema reads them back - in the browser and on the server.

![The Trade orders page showing the URL with symbol, status and quantity parameters, the matching chips and the filtered table](./images/url-state.png "The URL holds the same filters as the chips and header badges.")

> [!THINK]
> Two users pick NVDA then AAPL, and AAPL then NVDA.
> What must the writer do so both get the same URL and share one cache entry?

```ts title="filters-to-params.ts"
export const filtersToParams = (f: OrderFilters) => {
  const p = new URLSearchParams();
  [...f.symbols].sort().forEach((s) => p.append("symbol", s));
  [...f.statuses].sort().forEach((s) => p.append("status", s));
  if (f.quantityMin !== null) p.set("quantity_min", String(f.quantityMin));

  return p; // defaults skipped, fixed key order
};
```

> [!NUANCE]-
>
> - Someone can type anything into a URL. A nonsense value like `?status=banana` should quietly mean "no status filter", not an error page.
> - The data request, the preload and the export link all use the same writer, so the export always matches the screen.
> - For a table whose rows are all in the browser, TanStack's own column filters work well and give you option counts for free.
> - For a server table, TanStack's filter state is just an extra, untyped layer to translate in and out of. Skip it.

> [!INTERVIEW]-
>
> - _What did an unused filter API teach?_ A shared table kit shipped a second filter API that no page ever used, and it became dead code. Build the shared version after the second real use, not before the first.

> [!WIN]-
> Every chip, badge, URL and export agrees, because there is only one filter object and one writer.

> [!RECAP]
>
> - One function writes the URL and one schema reads it, on both ends.
> - Nonsense URL values quietly mean "no filter".

## Summary

> [!SUMMARY]
>
> - Load options lazily from all the user's data, selected-first by the applied value.
> - Keep half-typed numbers as text and dates as ISO text.
> - One page-owned filter object feeds headers, the panel and chips.
> - One writer makes the URL, request and export; one schema reads it back.

```quiz
[
  {
    "q": "The Symbol picker only lists symbols from the current page of results. What is the correct source for its options?",
    "options": [
      "The current filtered result set",
      "Unique values from the loaded rows",
      "A static list bundled with the client",
      "The unfiltered per-user baseline"
    ],
    "answer": 3,
    "expl": "Options from filtered rows shrink to what is already chosen. The unfiltered, scoped baseline keeps every valid value available; loaded rows have the same shrinking problem."
  },
  {
    "q": "Ticking a symbol makes that row jump to the top of the list while the cursor is on it. What causes it?",
    "options": [
      "Selected-first sorting reads the draft",
      "The search box re-sorts on each tick",
      "Extra search words reorder the items",
      "The options query refetches after each tick"
    ],
    "answer": 0,
    "expl": "Sorting selected items first from the draft moves rows on every tick. Sort by the applied value, which only changes on Apply."
  },
  {
    "q": "The options request fails and the picker shows 'No symbols found'. What should it show?",
    "options": [
      "The last cached options, silently",
      "An empty list with a loading skeleton",
      "An error with a retry action",
      "A disabled popover trigger"
    ],
    "answer": 2,
    "expl": "'No symbols' and 'the request failed' are different facts. Showing an empty list hides the outage."
  },
  {
    "q": "The quantity range draft stores parsed numbers. Typing '1e' makes the input jump to empty. Fix?",
    "options": [
      "Use type='number' on the input",
      "Debounce the parse by 300 ms",
      "Parse only on the Apply click",
      "Keep text drafts, parse on render"
    ],
    "answer": 3,
    "expl": "A half-typed input is not a number yet. Keep the text and derive the number and error each render, so they cannot fall out of step; parsing only on Apply loses the inline error."
  },
  {
    "q": "A user in New York picks 17 September and the calendar highlights the 16th. The code uses new Date('2026-09-17'). Why?",
    "options": [
      "The calendar library uses UTC internally",
      "The locale was not pinned to en-US",
      "Date-only strings parse as UTC",
      "toISOString drops the day component"
    ],
    "answer": 2,
    "expl": "Date-only ISO strings are UTC midnight, which is the previous evening in New York. Build dates from local year, month and day."
  },
  {
    "q": "Which keep a date filter hydration-safe? Select all that apply.",
    "options": [
      "Store ISO date strings in the filter object",
      "Compute 'This week' presets only inside onClick",
      "Default the range to the current week on render",
      "Store Date objects so both sides share a type"
    ],
    "answer": [0, 1],
    "multi": true,
    "expl": "Strings serialize identically everywhere and reading the clock only in handlers keeps render deterministic. A default from the clock or Date objects differ between server and client."
  },
  {
    "q": "Headers are built by getColumns(filters). Each filter change makes open popovers flash closed. Why?",
    "options": [
      "A new columns array remounts every header",
      "The filters object is too large to compare",
      "Popover state is stored in the columns",
      "The context provider re-renders the table root"
    ],
    "answer": 0,
    "expl": "A rebuilt columns array gives headers new identities and React remounts them. Read filters from context and keep columns stable; a plain re-render would not close anything."
  },
  {
    "q": "Which properties make the filter serializer's output canonical? Select all that apply.",
    "options": [
      "Default values are skipped",
      "List values are sorted before writing",
      "Keys are written in click order",
      "Values are base64 encoded"
    ],
    "answer": [0, 1],
    "multi": true,
    "expl": "Skipping defaults and sorting lists makes equivalent views produce identical strings, so they share cache entries. Click order would make the same view produce different URLs."
  },
  {
    "q": "A user hand-edits the URL to ?status=banana. What should happen?",
    "options": [
      "The status filter is treated as empty",
      "A 400 error page from the server",
      "The table shows zero rows for banana",
      "The client redirects to the default view"
    ],
    "answer": 0,
    "expl": "A URL is user input. Falling back per field turns junk into 'no filter', which the chips row makes visible, instead of an error page for a typo."
  }
]
```

```related
[
  {
    "title": "Column faceting",
    "url": "https://tanstack.com/table/v8/docs/guide/column-faceting",
    "source": "TanStack Table docs",
    "kind": "read",
    "note": "Option lists with counts, computed from the other filters."
  },
  {
    "title": "Column filtering guide",
    "url": "https://tanstack.com/table/v8/docs/guide/column-filtering",
    "source": "TanStack Table docs",
    "kind": "read",
    "note": "Built-in column filters - the right tool when all rows are in the browser."
  },
  {
    "title": "Data Table IV",
    "url": "https://www.greatfrontend.com/questions/user-interface/data-table-iv",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Hard",
    "note": "Add filtering to a generic table, then wire the filters into the URL."
  },
  {
    "title": "Debounce",
    "url": "https://www.greatfrontend.com/questions/javascript/debounce",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "note": "The helper behind search boxes that do not fire a request per keystroke."
  }
]
```
