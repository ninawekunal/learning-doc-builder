---
title: Sorting, filtering and pages - client or server
summary: Pick up the invoice table from Part 1 and add sorting, filtering and pages, two ways - TanStack Table in the browser, or React Query asking a server.
date: 2026-09-17
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
> - **Query key** - the array React Query uses to name a request, like `['invoices', { page: 2 }]`; a new key means a new request.
> - **Manual mode** - telling TanStack Table "the server already did this step, do not do it again".
> - **Debounce** - waiting until someone stops typing for a moment before acting on it.
> - **Page index** - which page you are on, counting from 0.

## The big picture

> [!TLDR]
> Every table runs the same three steps in the same order: filter, then sort, then cut out one page.
> The only question is who runs them: the browser (TanStack Table) or the server (React Query sends the settings).

In [Part 1](#/docs/first-data-table) you built an invoice table with a columns file, a cells file, React Query and TanStack Table.
Now the finance team wants to find overdue invoices, sort by amount, and flip through 240 of them 20 at a time.

> [!ANALOGY]
> Think of a library.
> Client-side is carrying every book home and sorting them on your floor.
> Server-side is asking the librarian for "the next 20 overdue books, biggest first".
> Few books? Carry them home. A whole library? Ask the librarian.

Table: each row is a question to ask before you choose where the table's work happens.

| Question                    | Client-side if...          | Server-side if...                    |
| --------------------------- | -------------------------- | ------------------------------------ |
| How many rows?              | A few thousand at most     | Tens of thousands or more            |
| Is every row safe to send?  | Yes                        | Some rows are private to other users |
| Does the data change a lot? | Rarely                     | Often, and pages must stay current   |
| Interview default?          | Yes, unless told otherwise | When they say "the API is paginated" |

We need something that behaves like a real paginated API, without a real server.
This mock grows Part 1's 12 invoices into 240 and answers page requests.
Every section below uses it.

> [!THINK]
> A server that pages must take some settings and return some numbers.
> What settings go in? (Think: which page, how big, sorted how, filtered how.)
> What must come back besides the rows, so the table can say "page 3 of 12"?

```ts title="mock-api.ts" download="mock-api.ts"
import base from "./invoices.json";
import type { Invoice, InvoiceStatus } from "./types";

export type InvoiceQuery = {
  pageIndex: number; // 0-based
  pageSize: number;
  sort?: { id: "number" | "vendor" | "amountCents" | "dueOn"; desc: boolean };
  search?: string;
  statuses?: InvoiceStatus[];
};

export type InvoicePage = { rows: Invoice[]; total: number };

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 240 invoices: Part 1's twelve, repeated with new ids and slightly different amounts.
const ALL: Invoice[] = Array.from({ length: 240 }, (_, i) => {
  const seed = base[i % base.length] as Invoice;

  return {
    ...seed,
    id: `inv_${String(i + 1).padStart(3, "0")}`,
    number: `INV-${1001 + i}`,
    amountCents: seed.amountCents + ((i * 137) % 5000),
  };
});

/** Client-side mode: hand over everything at once. */
export const fetchAllInvoices = async (): Promise<Invoice[]> => {
  await wait(300);

  return ALL;
};

/** Server-side mode: filter, then sort, then cut one page - in that order. */
export const fetchInvoicePage = async (
  query: InvoiceQuery,
): Promise<InvoicePage> => {
  await wait(300);

  const search = query.search?.trim().toLowerCase() ?? "";
  let rows = ALL.filter(
    (inv) =>
      (search === "" ||
        inv.vendor.toLowerCase().includes(search) ||
        inv.number.toLowerCase().includes(search)) &&
      (!query.statuses?.length || query.statuses.includes(inv.status)),
  );

  if (query.sort) {
    const { id, desc } = query.sort;

    rows = [...rows].sort(
      (a, b) => (a[id] < b[id] ? -1 : a[id] > b[id] ? 1 : 0) * (desc ? -1 : 1),
    );
  }

  const start = query.pageIndex * query.pageSize;

  return {
    rows: rows.slice(start, start + query.pageSize),
    total: rows.length,
  };
};
```

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
> Why does the Amount column sort correctly? (Remember what its accessor reads in Part 1.)

```tsx title="invoice-table.tsx" group="sort" tab="TanStack (client)"
import { useState } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { fetchAllInvoices } from "./mock-api";
import { invoiceColumns } from "./columns";
import type { Invoice } from "./types";

const EMPTY: Invoice[] = [];

export const InvoiceTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const { data } = useQuery({
    queryKey: ["invoices", "all"],
    queryFn: fetchAllInvoices,
  });

  const table = useReactTable({
    data: data ?? EMPTY,
    columns: invoiceColumns,
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

```tsx title="invoice-table.tsx" group="sort" tab="React Query (server)"
import { useState } from "react";
import { getCoreRowModel, useReactTable } from "@tanstack/react-table";
import type { SortingState } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { fetchInvoicePage } from "./mock-api";
import type { InvoiceQuery } from "./mock-api";
import { invoiceColumns } from "./columns";
import type { Invoice } from "./types";

const EMPTY: Invoice[] = [];

export const InvoiceTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const query: InvoiceQuery = {
    pageIndex: 0,
    pageSize: 20,
    sort: sorting[0]
      ? {
          id: sorting[0].id as NonNullable<InvoiceQuery["sort"]>["id"],
          desc: sorting[0].desc,
        }
      : undefined,
  };

  // The sort is part of the key, so a new sort is a new request.
  const { data } = useQuery({
    queryKey: ["invoices", query],
    queryFn: () => fetchInvoicePage(query),
  });

  const table = useReactTable({
    data: data?.rows ?? EMPTY,
    columns: invoiceColumns,
    state: { sorting },
    onSortingChange: setSorting,
    manualSorting: true, // the server already sorted; do not re-sort one page
    getCoreRowModel: getCoreRowModel(),
  });

  // The header markup is identical to the client tab.
  return null;
};
```

> [!NUANCE]+
> In server mode, forget `manualSorting: true` and TanStack sorts the 20 rows it was given.
> The page looks sorted, but it is only this page, re-shuffled.

> [!INTERVIEW]-
> Say why the header is a `<button>` inside the `<th>`.
> A clickable `<th>` is not reachable with the keyboard; a button is, and `aria-sort` tells screen readers the direction.

> [!RECAP]
>
> - Sorting state is `[{ id, desc }]`; TanStack's header toggle cycles it for you.
> - Client: add `getSortedRowModel()`. Server: put the sort in the query key and set `manualSorting`.
> - Use a real button in the header, plus `aria-sort`.

## Filtering

> [!TLDR]
> Filters are more state: a search box and a list of statuses.
> Every time a filter changes, go back to page 1.

Finance people filter constantly: "show me overdue", "show me Kestrel Cloud".
We add a text search over vendor and number, and a status filter.

> [!THINK]
> You are on page 7 and type "maple". Only 20 rows match. What page should you land on, and why?
> On the server version, what happens if you send a request on every keystroke?
> TanStack has "global filter" (one box, many columns) and "column filters" (one per column). Which fits each of our two filters?

```tsx title="invoice-table.tsx" group="filter" tab="TanStack (client)"
import { useState } from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

// In columns.tsx, give Status a filter that accepts a list of statuses:
// column.accessor('status', { header: 'Status', filterFn: 'arrIncludesSome', cell: ... })

export const InvoiceTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState(""); // the search box
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]); // [{ id: 'status', value: ['overdue'] }]
  const { data } = useInvoicesAll(); // fetchAllInvoices through useQuery, as in the sorting tab

  const table = useReactTable({
    data: data ?? EMPTY,
    columns: invoiceColumns,
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
        placeholder="Search vendor or invoice number"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
      />
      <select
        value={
          (
            columnFilters.find((f) => f.id === "status")?.value as
              | string[]
              | undefined
          )?.[0] ?? ""
        }
        onChange={(e) =>
          table
            .getColumn("status")
            ?.setFilterValue(e.target.value ? [e.target.value] : undefined)
        }
      >
        <option value="">All statuses</option>
        <option value="overdue">Overdue</option>
        <option value="open">Open</option>
        <option value="paid">Paid</option>
      </select>
      {/* table markup as before */}
    </>
  );
};
```

```tsx title="invoice-table.tsx" group="filter" tab="React Query (server)"
import { useDeferredValue, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchInvoicePage } from "./mock-api";
import type { InvoiceQuery } from "./mock-api";
import type { InvoiceStatus } from "./types";

export const InvoiceTable = () => {
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<InvoiceStatus[]>([]);
  const [pageIndex, setPageIndex] = useState(0);

  // Wait for typing to settle so we do not send a request per keystroke.
  const settledSearch = useDebounced(search, 250);

  const query: InvoiceQuery = {
    pageIndex,
    pageSize: 20,
    search: settledSearch,
    statuses,
  };
  const { data } = useQuery({
    queryKey: ["invoices", query],
    queryFn: () => fetchInvoicePage(query),
    placeholderData: keepPreviousData, // keep the old rows on screen while the new ones load
  });

  // Any filter change sends you back to the first page.
  const onSearch = (value: string) => {
    setSearch(value);
    setPageIndex(0);
  };
  const onStatuses = (next: InvoiceStatus[]) => {
    setStatuses(next);
    setPageIndex(0);
  };

  // ...inputs call onSearch / onStatuses; useReactTable gets manualFiltering: true
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

> [!GOTCHA]
> The classic bug: you are on page 7, you filter down to one page of results, and the table shows "no rows".
> Page 7 of a one-page list is empty.
> Reset to page 1 whenever a filter changes. TanStack does it for you on the client (`autoResetPageIndex`); on the server you must do it yourself.

> [!NUANCE]-
> Debounce the request, not the input.
> The text box should update on every key so typing feels instant; only the value you send to the server waits.

> [!RECAP]
>
> - Search box = global filter; per-column choices = column filters.
> - Any filter change resets you to page 1.
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

```tsx title="invoice-table.tsx" group="page" tab="TanStack (client)"
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

const table = useReactTable({
  data: data ?? EMPTY,
  columns: invoiceColumns,
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

```tsx title="invoice-table.tsx" group="page" tab="React Query (server)"
const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 20 })

const query: InvoiceQuery = { ...pagination, sort, search: settledSearch, statuses }
const { data, isFetching } = useQuery({
  queryKey: ['invoices', query],
  queryFn: () => fetchInvoicePage(query),
  placeholderData: keepPreviousData, // old page stays visible while the next loads
})

const table = useReactTable({
  data: data?.rows ?? EMPTY,
  columns: invoiceColumns,
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

> [!RECAP]
>
> - Paging state is `{ pageIndex, pageSize }`, with `pageIndex` starting at 0.
> - Server mode needs `manualPagination` and the total as `rowCount`.
> - `keepPreviousData` stops the table flashing empty between pages.

## Optional: polish it with shadcn

> [!TLDR]
> Three upgrades interviewers love to see if time allows: a filter popover in the column header, a separate sort menu, and shadcn's pagination bar.
> None of them change the logic; they only call the same state setters.

```bash title="terminal"
npx shadcn@latest add popover checkbox dropdown-menu select button
```

### A status filter inside the column header

A small filter icon in the "Status" header opens a popover with checkboxes.
It reads and writes the same column filter as before.

> [!THINK]
> The popover needs the column. What object does TanStack pass to a `header` function that holds it?
> How do you show that a filter is active while the popover is closed?

```tsx title="status-header.tsx"
import type { Column } from "@tanstack/react-table";
import { ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Invoice, InvoiceStatus } from "./types";

const STATUSES: InvoiceStatus[] = ["draft", "open", "paid", "overdue", "void"];

export const StatusHeader = ({
  column,
}: {
  column: Column<Invoice, unknown>;
}) => {
  const picked = (column.getFilterValue() as InvoiceStatus[] | undefined) ?? [];

  const toggle = (status: InvoiceStatus) => {
    const next = picked.includes(status)
      ? picked.filter((s) => s !== status)
      : [...picked, status];

    column.setFilterValue(next.length ? next : undefined);
  };

  return (
    <div className="flex items-center gap-1">
      Status
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Filter by status"
            className="relative size-7"
          >
            <ListFilter className="size-4" />
            {picked.length > 0 && (
              <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-2">
          {STATUSES.map((status) => (
            <label
              key={status}
              className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm capitalize"
            >
              <Checkbox
                checked={picked.includes(status)}
                onCheckedChange={() => toggle(status)}
              />
              {status}
            </label>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
};

// columns.tsx: column.accessor('status', { header: ({ column }) => <StatusHeader column={column} />, ... })
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
  { value: "dueOn:asc", label: "Due date, soonest first" },
  { value: "amountCents:desc", label: "Amount, largest first" },
  { value: "amountCents:asc", label: "Amount, smallest first" },
  { value: "vendor:asc", label: "Vendor, A to Z" },
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
> - Any filter change resets to page 1.
> - Debounce server search and use `keepPreviousData` so the table never flashes empty.
> - Popovers, sort menus and pagination bars only call the same state setters.

Next, [Part 3](#/docs/server-tables-request-pipeline) builds the server side for real, with a small backend in front of the API.

```quiz
[
  {
    "q": "You are on page 6 of invoices and type 'kestrel' in search. Twelve invoices match, and the table shows 'No invoices'. What is the bug?",
    "options": ["The search compares upper and lower case letters differently", "The page index was not reset to 0 when the filter changed", "The server counted the total before it applied the filter", "The React Query key does not include the search text"],
    "answer": 1,
    "expl": "Twelve matches fit on page 1, so page 6 is empty. Every filter change must send you back to the first page."
  },
  {
    "q": "In server mode, clicking the Amount header re-orders the rows, but the biggest invoice overall never appears on page 1. What is missing?",
    "options": ["getSortedRowModel() added to the table options", "The sort in the query key, plus manualSorting", "A stable id-based key on each table row", "placeholderData: keepPreviousData on the query"],
    "answer": 1,
    "expl": "Without the sort in the query key, the server never hears about it, and TanStack just shuffles the 20 rows it has. The server must sort all rows; manualSorting stops TanStack re-sorting the page."
  },
  {
    "q": "Your server-side 'Showing 1-20 of 20' never changes, whatever you search. Where is the mistake most likely?",
    "options": ["The server counts the total after slicing out the page", "The search debounce delay is set far too short", "pageSize is sent as a string instead of a number", "The columns array is rebuilt inside the component"],
    "answer": 0,
    "expl": "Counting after slicing always gives at most one page's worth. Count after filtering and before slicing."
  },
  {
    "q": "The table flashes blank every time you click Next in server mode. Which change fixes that?",
    "options": ["placeholderData: keepPreviousData on the query", "manualPagination: false", "Removing the page from the query key", "A longer staleTime"],
    "answer": 0,
    "expl": "A new page is a new key, so there is no data for it yet. keepPreviousData shows the old page until the new one arrives. Removing the page from the key would stop paging altogether."
  },
  {
    "q": "Which of these should make you choose server-side over client-side? Select all that apply.",
    "options": ["There are 200,000 invoices", "Some invoices belong to other teams and must never reach this user's browser", "The interviewer says 'the API returns one page at a time'", "You want the header to show sort arrows"],
    "answer": [0, 1, 2],
    "multi": true,
    "expl": "Size, privacy and an already-paged API all push the work to the server. Sort arrows work the same either way."
  },
  {
    "q": "The search box feels laggy in server mode because each keystroke waits for a request. What is the right fix?",
    "options": ["Debounce only the value sent to the server", "Debounce the text box's onChange handler itself", "Filter only the rows already on the current page", "Remove the search text from the query key"],
    "answer": 0,
    "expl": "The input should update on every key so typing feels instant. Only the value that goes into the query key waits for typing to settle."
  },
  {
    "q": "A header filter popover is closed, and the table shows only overdue invoices. Users think data is missing. What should the header show?",
    "options": ["Nothing; the popover explains the filter once opened", "A dot or count on the filter button", "A toast message that appears every time the page loads", "The full list of all five statuses inside the header"],
    "answer": 1,
    "expl": "A hidden active filter looks like missing data. A dot or count on the filter icon tells users a filter is on without opening anything."
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
    "note": "Add column sorting to a paginated table - the sorting section as an interview question."
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
    "title": "Paginated queries",
    "url": "https://tanstack.com/query/latest/docs/framework/react/guides/paginated-queries",
    "source": "TanStack Query docs",
    "kind": "read",
    "note": "Why keepPreviousData exists and how page keys work."
  },
  {
    "title": "Pagination guide",
    "url": "https://tanstack.com/table/v8/docs/guide/pagination",
    "source": "TanStack Table docs",
    "kind": "read",
    "note": "Client and manual (server) pagination, including rowCount."
  },
  {
    "title": "Column filtering guide",
    "url": "https://tanstack.com/table/v8/docs/guide/column-filtering",
    "source": "TanStack Table docs",
    "kind": "read",
    "note": "Built-in filter functions like arrIncludesSome, and manual filtering."
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
