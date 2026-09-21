---
title: Sorting, filtering and pages - client or server
summary: Pick up the positions table from Part 1 and add sorting, filtering and pages, two ways - TanStack Table in the browser, or React Query asking a server.
date: 2026-09-20
part: 2
series: Data Tables in React
tags: [tanstack-table, react-query, shadcn, interviews]
minutes: 15
---

> [!TERMS]
>
> - **Client-side** - the browser has every row and does the sorting, filtering and paging itself.
> - **Server-side** - the server does the work and sends back only the page you asked for.
> - **Row model** - TanStack's name for one step that turns rows into fewer or re-ordered rows, like "sorted rows".
> - **Query key** - the array React Query uses to name a request, like `['positions', { page: 2 }]`; a new key means a new request.
> - **Manual mode** - telling TanStack Table "the server already did this step, do not do it again".
> - **Debounce** - waiting until someone stops typing for a moment before acting on it.
> - **Page index** - which page you are on, counting from 0.

## The big picture

> [!TLDR]
> Every table runs the same three steps in the same order: filter, then sort, then cut out one page.
> The only question is who runs them: the browser (TanStack Table) or the server (React Query sends the settings).

In [Part 1](#/docs/first-data-table) you built a positions table with a columns file, a cells file, React Query and TanStack Table.
Now the desk wants to find distressed FX positions, sort by Day P&L, and flip through 240 of them 20 at a time.

> [!ANALOGY]
> Think of an order runner on a trading floor.
> Client-side is grabbing the whole book of tickets and sorting them yourself at your desk.
> Server-side is radioing the desk head for "the next twenty overdue tickets, biggest first".
> A handful of tickets? Grab them. A whole book? Radio it in.

Table: each row is a question to ask before you choose where the table's work happens.

| Question                    | Client-side if...          | Server-side if...                    |
| --------------------------- | -------------------------- | ------------------------------------ |
| How many rows?              | A few thousand at most     | Tens of thousands or more            |
| Is every row safe to send?  | Yes                        | Some positions belong to other desks |
| Does the data change a lot? | Rarely                     | Often, and pages must stay current   |
| Interview default?          | Yes, unless told otherwise | When they say "the API is paginated" |

We need something that behaves like a real paginated API, without a real server.
This mock grows Part 1's 12 positions into 240 and answers page requests.
Every section below uses it.

> [!THINK]
> A server that pages must take some settings and return some numbers.
> What settings go in? (Think: which page, how big, sorted how, filtered how.)
> What must come back besides the rows, so the table can say "page 3 of 12"?

```ts title="mock-api.ts" download="mock-api.ts"
import base from "./positions.json";
import type { Desk, Position } from "./types";

export type PositionQuery = {
  pageIndex: number; // 0-based
  pageSize: number;
  sort?: {
    id: "symbol" | "quantity" | "priceCents" | "dayPnlCents";
    desc: boolean;
  };
  search?: string;
  desks?: Desk[];
};

export type PositionPage = { rows: Position[]; total: number };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 240 positions: Part 1's twelve, repeated with new ids and slightly different prices.
const ALL: Position[] = Array.from({ length: 240 }, (_, i) => {
  const seed = base[i % base.length] as Position;

  return {
    ...seed,
    id: `pos_${String(i + 1).padStart(3, "0")}`,
    priceCents: seed.priceCents + ((i * 137) % 5000),
    dayPnlCents: i % 9 === 0 ? null : seed.dayPnlCents,
  };
});

/** Client-side mode: hand over everything at once. */
export const fetchAllPositions = async (): Promise<Position[]> => {
  await wait(300);

  return ALL;
};

/** Server-side mode: filter, then sort, then cut one page - in that order. */
export const fetchPositionPage = async (
  query: PositionQuery,
): Promise<PositionPage> => {
  await wait(300);

  const search = query.search?.trim().toLowerCase() ?? "";
  let rows = ALL.filter(
    (pos) =>
      (search === "" ||
        pos.symbol.toLowerCase().includes(search) ||
        pos.trader.toLowerCase().includes(search)) &&
      (!query.desks?.length || query.desks.includes(pos.desk)),
  );

  if (query.sort) {
    const { id, desc } = query.sort;

    rows = [...rows].sort(
      (a, b) =>
        (a[id]! < b[id]! ? -1 : a[id]! > b[id]! ? 1 : 0) * (desc ? -1 : 1),
    );
  }

  const start = query.pageIndex * query.pageSize;

  return {
    rows: rows.slice(start, start + query.pageSize),
    total: rows.length,
  };
};
```

If a candidate's table slices out one page first and only then runs the search box against those twenty rows, the search looks broken: a match sitting on page 9 simply never appears, and the footer's total is wrong too.
That is why the mock filters before it slices, every time.

> [!NUANCE]+
> The total must be counted after filtering and before slicing.
> Count after slicing and every search says "20 results".

> [!RECAP]
>
> - Filter, then sort, then page. Always that order.
> - Client-side means TanStack does the steps; server-side means React Query sends the settings.
> - A paging API returns the rows for one page plus the total count.

## Sorting

> [!TLDR]
> Keep "which column, which direction" in state.
> On the client, TanStack sorts for you; on the server, that state goes into the query key.

Clicking a header should cycle: ascending, descending, off.
TanStack gives every header a ready-made toggle for exactly that.

> [!THINK]
> Where does the sort live: in the table, or in your component's state?
> For the server version, what has to change so React Query fetches again when the sort changes?
> Why does the Quantity column sort correctly even for short positions? (Remember what its accessor reads in Part 1.)

```tsx title="position-table.tsx" group="sort" tab="TanStack (client)"
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { fetchAllPositions } from "./mock-api";
import { positionColumns } from "./columns";
import type { Position } from "./types";

const EMPTY: Position[] = [];

export const PositionTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data } = useQuery({
    queryKey: ["positions", "all"],
    queryFn: fetchAllPositions,
  });

  const table = useReactTable({
    data: data ?? EMPTY,
    columns: positionColumns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(), // the browser sorts
  });

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th
                key={header.id}
                aria-sort={ariaSort(header.column.getIsSorted())}
              >
                <button
                  type="button"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                  {{ asc: " ↑", desc: " ↓" }[
                    header.column.getIsSorted() as string
                  ] ?? ""}
                </button>
              </th>
            ))}
          </tr>
        ))}
      </thead>
      {/* tbody exactly as in Part 1 */}
    </table>
  );
};

const ariaSort = (dir: false | "asc" | "desc") =>
  dir === "asc" ? "ascending" : dir === "desc" ? "descending" : "none";
```

```tsx title="position-table.tsx" group="sort" tab="React Query (server)"
import { useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { fetchPositionPage } from "./mock-api";
import type { PositionQuery } from "./mock-api";
import { positionColumns } from "./columns";
import type { Position } from "./types";

const EMPTY: Position[] = [];

export const PositionTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const query: PositionQuery = {
    pageIndex: 0,
    pageSize: 20,
    sort: sorting[0]
      ? {
          id: sorting[0].id as NonNullable<PositionQuery["sort"]>["id"],
          desc: sorting[0].desc,
        }
      : undefined,
  };

  // The sort is part of the key, so a new sort is a new request.
  const { data } = useQuery({
    queryKey: ["positions", query],
    queryFn: () => fetchPositionPage(query),
  });

  const table = useReactTable({
    data: data?.rows ?? EMPTY,
    columns: positionColumns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true, // the server already sorted; do not re-sort one page
    getCoreRowModel: getCoreRowModel(),
  });

  // The header markup is identical to the client tab.
  return null;
};
```

The Day P&L column needs one more thing: some positions have no previous close yet, so `dayPnlCents` is `null`.

```ts
columnHelper.accessor((row) => row.dayPnlCents ?? undefined, {
  id: "dayPnlCents",
  sortUndefined: "last", // positions with no P&L stay at the bottom
});
```

> [!NUANCE]
>
> - Empty values should sit at the bottom whether you sort up or down. `sortUndefined: "last"` runs _before_ TanStack flips the direction for descending, so it survives the flip; a custom `sortingFn` alone cannot do this, because TanStack negates whatever it returns.
> - `sortUndefined` only notices `undefined`, not `null`, which is why the accessor turns `null` into `undefined`.
> - On the first click, TanStack sorts text A to Z but numbers **largest first**. `sortDescFirst: false` makes every column start ascending.

> [!INTERVIEW]-
>
> - _Why make the header a real `Button`?_ Keyboard users can tab to it and press Enter, for free, and `aria-sort` tells screen readers the direction.
> - _How do you sort by two columns?_ Shift-click the second header. TanStack keeps an array of sorts; `getSortIndex()` tells you which one is the tie-breaker.

> [!RECAP]
>
> - Sorting state is `[{ id, desc }]`; TanStack's header toggle cycles it for you.
> - Client: add `getSortedRowModel()`. Server: put the sort in the query key and set `manualSorting`.
> - `sortUndefined: "last"` keeps empty P&L values at the bottom in both directions; a plain `sortingFn` cannot.

## Filtering

> [!TLDR]
> One filtering row model powers both the search box and a desk filter.
> Write your own search function that names exactly which fields it checks, and jump back to page 1 on every change.

Traders filter constantly: "show me FX", "show me R. Alvarez's book".
We add a text search over symbol and trader, and a desk filter.

> [!THINK]
> You are on page 7 and type "nvda". Only 6 rows match. What page should you land on, and why?
> On the server version, what happens if you send a request on every keystroke?
> TanStack has "global filter" (one box, many columns) and "column filters" (one per column). Which fits each of our two filters?

```tsx title="position-table.tsx" group="filter" tab="TanStack (client)"
import { useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

// In columns.tsx, give Desk a filter that accepts a list of desks:
// column.accessor('desk', { header: 'Desk', filterFn: 'arrIncludesSome', cell: ... })

export const PositionTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(""); // the search box
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); // [{ id: 'desk', value: ['FX'] }]
  const { data } = usePositionsAll(); // fetchAllPositions through useQuery, as in the sorting tab

  const table = useReactTable({
    data: data ?? EMPTY,
    columns: positionColumns,
    state: { sorting, globalFilter, columnFilters },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // step 1: filter
    getSortedRowModel: getSortedRowModel(), // step 2: sort
  });

  return (
    <>
      <input
        type="search"
        placeholder="Search symbol or trader"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />
      <select
        value={
          (
            columnFilters.find((f) => f.id === "desk")?.value as
              | string[]
              | undefined
          )?.[0] ?? ""
        }
        onChange={(e) =>
          table
            .getColumn("desk")
            ?.setFilterValue(e.target.value ? [e.target.value] : undefined)
        }
      >
        <option value="">All desks</option>
        <option value="Equities">Equities</option>
        <option value="FX">FX</option>
        <option value="Rates">Rates</option>
      </select>
      {/* table markup as before */}
    </>
  );
};
```

```tsx title="position-table.tsx" group="filter" tab="React Query (server)"
import { useDeferredValue, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchPositionPage } from "./mock-api";
import type { PositionQuery } from "./mock-api";
import type { Desk } from "./types";

export const PositionTable = () => {
  const [search, setSearch] = useState("");
  const [desks, setDesks] = useState<Desk[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

  // Wait for typing to settle so we do not send a request per keystroke.
  const settledSearch = useDebounced(search, 250);

  const query: PositionQuery = {
    pageIndex,
    pageSize: 20,
    search: settledSearch,
    desks,
  };
  const { data } = useQuery({
    queryKey: ["positions", query],
    queryFn: () => fetchPositionPage(query),
    placeholderData: keepPreviousData, // keep the old rows on screen while the new ones load
  });

  // Any filter change sends you back to the first page.
  const onSearch = (value: string) => {
    setSearch(value);
    setPageIndex(0);
  };
  const onDesks = (next: Desk[]) => {
    setDesks(next);
    setPageIndex(0);
  };

  // ...inputs call onSearch / onDesks; useReactTable gets manualFiltering: true
  return null;
};

const useDebounced = <T,>(value: T, ms: number): T => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);

    return () => clearTimeout(id);
  }, [value, ms]);

  return settled;
};
```

Resetting the page has to happen in the same handler that sets the search, not later.

```tsx
const onSearch = (value: string) => {
  setSearch(value);
  setPage(1); // same event, so React shows both changes together
};
```

A teammate might reach for `useEffect(() => setPage(1), [search])` instead.
That effect runs _after_ React has already committed a render with the new search and the old page, so the browser paints one stale, often-empty, frame before the effect catches up.

> [!GOTCHA]
> The classic bug: a trader is on page 7, filters down to one page of results, and the table shows "no positions".
> Page 7 of a one-page list is empty.
> Reset to page 1 whenever a filter changes. TanStack does it for you on the client (`autoResetPageIndex`); on the server you must do it yourself.

> [!NUANCE]-
>
> - TanStack guesses which columns are searchable by looking at the **first row only**. If that row happens to have an empty trader, the trader column silently stops being searchable. Naming the fields yourself in `globalFilterFn` avoids the guess.
> - A dropdown filter should match exactly (`filterFn: "equals"` or `"arrIncludesSome"`). The default "contains" match means "FX" also matches a later "FX Options" desk. The dropdown component refuses an empty value, so "All desks" uses a stand-in value that clears the filter.
> - Debounce the request, not the input. The text box should update on every key so typing feels instant; only the value you send to the server waits.

> [!RECAP]
>
> - Search box = global filter; per-column choices = column filters.
> - Any filter change resets you to page 1, in the same handler that sets the filter.
> - On the server, debounce the search and keep the previous rows on screen while loading.

## Pages

> [!TLDR]
> Paging state is two numbers: which page and how many per page.
> The server version also needs the total, so it knows how many pages exist.

Last step of the pipeline: cut out one page.
This is also where the two approaches differ most.

> [!THINK]
> On the client, TanStack can count pages itself. Why can it not on the server?
> What should the screen show between clicking "Next" and the new page arriving: a spinner, a blank table, or the old page?
> What should the "Next" button do on the last page?

```tsx title="position-table.tsx" group="page" tab="TanStack (client)"
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

const table = useReactTable({
  data: data ?? EMPTY,
  columns: positionColumns,
  state: { sorting, globalFilter, columnFilters, pagination },
  onPaginationChange: setPagination,
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(), // 1. filter
  getSortedRowModel: getSortedRowModel(), // 2. sort
  getPaginationRowModel: getPaginationRowModel(), // 3. page
})

// Controls: TanStack counts pages from the filtered rows.
<footer>
  <button type="button" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
    Previous
  </button>
  <span>
    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
  </span>
  <button type="button" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
    Next
  </button>
</footer>
```

```tsx title="position-table.tsx" group="page" tab="React Query (server)"
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

const query: PositionQuery = { ...pagination, sort, search: settledSearch, desks }
const { data, isFetching } = useQuery({
  queryKey: ['positions', query],
  queryFn: () => fetchPositionPage(query),
  placeholderData: keepPreviousData, // old page stays visible while the next loads
})

const table = useReactTable({
  data: data?.rows ?? EMPTY,
  columns: positionColumns,
  state: { sorting, pagination },
  onPaginationChange: setPagination,
  manualPagination: true, // the server already cut the page
  manualSorting: true,
  manualFiltering: true,
  rowCount: data?.total ?? 0, // lets TanStack work out getPageCount()
  getCoreRowModel: getCoreRowModel(),
})

// Same footer as the client tab; dim the rows while the next page loads.
<tbody style={{ opacity: isFetching ? 0.6 : 1 }}>{/* rows */}</tbody>
```

Count the total before the page is cut, not after.
`getPrePaginationRowModel()` is the filtered, sorted list before slicing; `getRowModel()` is already sliced down to one page.
A footer that reads its total from `getRowModel()` always says "20 of 20", however many positions actually matched.

Table: each row is one paging detail, and how the two approaches handle it.

| Detail            | TanStack (client)          | React Query (server)                        |
| ----------------- | -------------------------- | ------------------------------------------- |
| Who cuts the page | `getPaginationRowModel()`  | The server, from `pageIndex` and `pageSize` |
| How many pages    | Counted from filtered rows | `rowCount` from the server's total          |
| While loading     | Instant, no loading        | `keepPreviousData` keeps the old page up    |
| Reset on filter   | Automatic                  | You call `setPagination` yourself           |

> [!WIN]-
> Both tabs share the same columns, cells and footer.
> Switching a table from client to server later is a change to the options and one hook, not a rewrite.

> [!NUANCE]-
> `autoResetPageIndex` is on by default, and it treats a data refresh as a reason to reset. On a live-updating blotter, that means a new batch of prices throws every trader back to page 1 every few seconds. Turn it off, and resetting on sort and filter changes becomes your job again.

> [!RECAP]
>
> - Paging state is `{ pageIndex, pageSize }`, with `pageIndex` starting at 0.
> - Count the total from `getPrePaginationRowModel()`, never from `getRowModel()`.
> - Server mode needs `manualPagination` and the total as `rowCount`.

## Optional: polish it with shadcn

> [!TLDR]
> Three upgrades interviewers love to see if time allows: a filter popover in the column header, a separate sort menu, and shadcn's pagination bar.
> None of them change the logic; they only call the same state setters.

```bash title="terminal"
npx shadcn@latest add popover checkbox dropdown-menu select button
```

### A desk filter inside the column header

A small filter icon in the "Desk" header opens a popover with checkboxes.
It reads and writes the same column filter as before.

> [!THINK]
> The popover needs the column. What object does TanStack pass to a `header` function that holds it?
> How do you show that a filter is active while the popover is closed?

```tsx title="desk-header.tsx"
import type { Column } from "@tanstack/react-table";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Desk, Position } from "./types";

const DESKS: Desk[] = ["Equities", "FX", "Rates", "Credit"];

export const DeskHeader = ({
  column,
}: {
  column: Column<Position, unknown>;
}) => {
  const picked = (column.getFilterValue() as Desk[] | undefined) ?? [];

  const toggle = (desk: Desk) => {
    const next = picked.includes(desk)
      ? picked.filter((d) => d !== desk)
      : [...picked, desk];

    column.setFilterValue(next.length ? next : undefined);
  };

  return (
    <div className="flex items-center gap-1">
      Desk
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Filter by desk"
            className="relative size-7"
          >
            <ListFilter className="size-4" />
            {picked.length > 0 && (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-2">
          {DESKS.map((desk) => (
            <label
              key={desk}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm"
            >
              <Checkbox
                checked={picked.includes(desk)}
                onCheckedChange={() => toggle(desk)}
              />
              {desk}
            </label>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
};

// columns.tsx: column.accessor('desk', { header: ({ column }) => <DeskHeader column={column} />, ... })
```

### A sort menu above the table

On phones, tiny header buttons are hard to hit.
A "Sort by" menu above the table sets the same sorting state.

```tsx title="sort-menu.tsx"
import type { SortingState } from "@tanstack/react-table";
import { ArrowDownWideNarrow, ArrowUpNarrowWide } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const OPTIONS = [
  { value: "dayPnlCents:desc", label: "Day P&L, best first" },
  { value: "dayPnlCents:asc", label: "Day P&L, worst first" },
  { value: "priceCents:desc", label: "Price, highest first" },
  { value: "symbol:asc", label: "Symbol, A to Z" },
];

type SortMenuProps = {
  sorting: SortingState;
  onChange: (next: SortingState) => void;
};

export const SortMenu = ({ sorting, onChange }: SortMenuProps) => {
  const current = sorting[0]
    ? `${sorting[0].id}:${sorting[0].desc ? "desc" : "asc"}`
    : "";
  const Icon = sorting[0]?.desc ? ArrowDownWideNarrow : ArrowUpNarrowWide;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Icon className="size-4" />
          {OPTIONS.find((o) => o.value === current)?.label ?? "Sort by"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={current}
          onValueChange={(value) => {
            const [id, dir] = value.split(":");
            onChange([{ id, desc: dir === "desc" }]);
          }}
        >
          {OPTIONS.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
```

### A shadcn pagination bar

The footer grows a "rows per page" picker and a "Showing 21-40 of 240" line.
It only needs the `table` object, so it works in both client and server mode.

```tsx title="table-pagination.tsx"
import type { Table } from "@tanstack/react-table";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const TablePagination = <T,>({
  table,
  total,
}: {
  table: Table<T>;
  total: number;
}) => {
  const { pageIndex, pageSize } = table.getState().pagination;
  const from = total === 0 ? 0 : pageIndex * pageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * pageSize);

  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <span className="tabular-nums text-muted-foreground">
        Showing {from}-{to} of {total}
      </span>
      <div className="flex items-center gap-2">
        <Select
          value={String(pageSize)}
          onValueChange={(v) => table.setPageSize(Number(v))}
        >
          <SelectTrigger className="h-8 w-[88px]" aria-label="Rows per page">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[10, 20, 50].map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n} / page
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};

// Client: total = table.getFilteredRowModel().rows.length   Server: total = data?.total ?? 0
```

> [!RECAP]
>
> - UI pieces call the same setters: `setFilterValue`, `setSorting`, `setPageSize`.
> - Show when a filter is active, even while its popover is closed.
> - One pagination component serves both modes; only where `total` comes from changes.

## Summary

> [!SUMMARY]
>
> - Filter, then sort, then page; the total is counted after filtering.
> - Client-side: TanStack row models do the three steps on data you already have.
> - Server-side: put the settings in the React Query key, and set `manualSorting`, `manualFiltering`, `manualPagination` and `rowCount`.
> - Any filter change resets to page 1, in the same handler that sets the filter.
> - Debounce server search and use `keepPreviousData` so the table never flashes empty.
> - Popovers, sort menus and pagination bars only call the same state setters.

Next, [Part 3](#/docs/server-tables-request-pipeline) builds the server side for real, with a small backend in front of the API.

```quiz
[
  {
    "q": "A candidate's table slices out page 3 first, then runs the search box against just those twenty rows. What does the trader actually see when they search?",
    "options": [
      "Only this page's matches, with the wrong total count",
      "Correct results, just computed less efficiently",
      "An error because the page index goes out of range",
      "Correct rows, but in a randomised order"
    ],
    "answer": 0,
    "expl": "Paginating first means the search only ever looks at twenty rows, so a match sitting on another page simply disappears and the footer's total is wrong too. It is not just slower - the order changes what the user actually sees."
  },
  {
    "q": "Sorting Day P&L descending, positions with no previous close jump to the very top instead of staying at the bottom. The sortingFn checks for null before returning sign * compare(a, b). What fixes it?",
    "options": [
      "Map null P&L values to zero inside the accessor",
      "Handle the null case before the direction sign is applied",
      "Filter out positions with a null P&L before sorting",
      "Sort ascending only, then reverse the array afterwards"
    ],
    "answer": 1,
    "expl": "TanStack negates whatever a sortingFn returns for descending order, so a null check placed under that sign flip gets flipped right along with everything else. Mapping null to zero would hide a real 'no data yet' state and drop those rows into the middle of the table instead of the bottom."
  },
  {
    "q": "A teammate resets the page with useEffect(() => setPage(1), [search]) whenever the search box changes. What does the trader actually see?",
    "options": [
      "Nothing different, effects run before the browser paints",
      "An infinite loop between the search and page state",
      "One rendered frame showing a stale, often empty, page",
      "The page only resets after the debounce timer fires"
    ],
    "answer": 2,
    "expl": "The effect runs after React has already committed a render with the new search text and the old page number, so the browser paints one wrong frame before the effect catches up. Resetting the page inside the same handler that sets the search avoids that frame entirely."
  },
  {
    "q": "On a live-updating blotter, traders keep getting bounced back to page 1 every few seconds even though nobody touched search or sort. What explains it?",
    "options": [
      "manualPagination is set to false by default",
      "pageSize keeps reverting to its initialState value",
      "getPaginationRowModel recomputes on every price tick",
      "autoResetPageIndex treats new data as a reason to reset"
    ],
    "answer": 3,
    "expl": "autoResetPageIndex is on by default and counts a data refresh as a reason to reset, so ticking prices throw everyone back to page 1 every few seconds. Turning it off means sort and filter changes need their own explicit reset again."
  },
  {
    "q": "The footer reads '1-20 of 20' even though the search box clearly matches 57 positions. Which row model is the footer reading from?",
    "options": [
      "getRowModel, which is sliced down to one page",
      "getPrePaginationRowModel, which is filtered and sorted",
      "getCoreRowModel, which ignores filtering completely",
      "getFilteredRowModel, before sorting has been applied"
    ],
    "answer": 0,
    "expl": "getRowModel sits at the very end of the pipeline, so it only ever holds one page's worth of rows. The honest total lives in getPrePaginationRowModel - filtered and sorted, but not yet sliced down to a page."
  },
  {
    "q": "Which statements about keeping positions with no previous close at the bottom, in both sort directions, are true? Select all that apply.",
    "options": [
      "sortUndefined: 'last' is applied before the descending flip",
      "A custom sortingFn alone can pin them in both directions",
      "sortUndefined only checks for undefined, so map null to undefined first",
      "sortDescFirst: false keeps them at the bottom on the first click"
    ],
    "answer": [0, 2],
    "multi": true,
    "expl": "TanStack negates a custom sortingFn's result for descending order, so a plain comparator cannot hold nulls in place either way; sortUndefined runs before that flip but only recognises undefined, which is why the accessor turns null into undefined. sortDescFirst only changes which direction a header starts in, not where empty values land."
  },
  {
    "q": "The search box stops finding any position by trader name, but only on days when the very first row in the data happens to have no trader assigned. What is going on?",
    "options": [
      "The default filter is case-sensitive on that column",
      "TanStack infers a searchable column from the first row's value",
      "Global filters skip every column that can contain nulls",
      "The debounce timer drops the first character typed"
    ],
    "answer": 1,
    "expl": "TanStack checks the type of the first row's value to decide whether a column counts as globally searchable, so one missing trader on row one silently removes the whole column from search. Naming the fields yourself inside globalFilterFn removes the guesswork."
  },
  {
    "q": "The desk filter is checked for 'FX', and a new 'FX Options' desk starts appearing in the results too. What fixes the facet?",
    "options": [
      "Trim whitespace from every desk value before filtering",
      "Move the desk field into the global search fields",
      "Set the desk column's filterFn to an exact match",
      "Use a sentinel value for the 'All desks' option"
    ],
    "answer": 2,
    "expl": "The default string filter is a contains match, so 'FX' matches 'FX Options' the moment that desk exists. A facet is meant to be an exact choice, which filterFn: 'equals' (or arrIncludesSome for a list) gives you. The sentinel value solves a different problem - a picker component that rejects an empty string."
  }
]
```

```related
[
  {
    "title": "Data Table II",
    "url": "https://www.greatfrontend.com/questions/user-interface/data-table-ii",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Medium",
    "note": "Add column sorting to a paginated table - the Sorting section as an interview question."
  },
  {
    "title": "Data Table IV",
    "url": "https://www.greatfrontend.com/questions/user-interface/data-table-iv",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Hard",
    "note": "Add filtering on top of sorting and pages - the whole pipeline from this part."
  },
  {
    "title": "Sorting guide",
    "url": "https://tanstack.com/table/v8/docs/guide/sorting",
    "source": "TanStack Table docs",
    "kind": "read",
    "note": "sortingFn, sortUndefined and sortDescFirst, covered in depth."
  },
  {
    "title": "Column filtering guide",
    "url": "https://tanstack.com/table/v8/docs/guide/column-filtering",
    "source": "TanStack Table docs",
    "kind": "read",
    "note": "Built-in filter functions like arrIncludesSome, and manual filtering."
  },
  {
    "title": "Pagination guide",
    "url": "https://tanstack.com/table/v8/docs/guide/pagination",
    "source": "TanStack Table docs",
    "kind": "read",
    "note": "Client and manual (server) pagination, including rowCount."
  },
  {
    "title": "Pagination",
    "url": "https://ui.shadcn.com/docs/components/pagination",
    "source": "shadcn/ui",
    "kind": "read",
    "note": "shadcn's pagination pieces, for a numbered page bar."
  }
]
```
