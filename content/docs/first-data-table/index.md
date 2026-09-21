---
title: Your first data table - a positions blotter
summary: Take a small file of trading positions and turn it into a real table, step by step, the way you would in a frontend interview.
date: 2026-09-20
part: 1
series: Data Tables in React
tags: [tanstack-table, react-query, shadcn, interviews]
topic: Data tables in React
minutes: 14
---

> [!TERMS]
>
> - **Data table** - a table on screen built from an array of objects, one object per row.
> - **Row** - one record on screen; here, one trading position.
> - **Column definition** - a small object that says how to read one value out of a row and how to draw it.
> - **Cell** - the small component that draws one value, like a price or a status.
> - **Position** - a holding a trading desk currently owns; positive quantity is long, negative is short.
> - **Minor units** - money stored as whole cents, so `227.50` dollars is saved as `22750`.
> - **React Query (TanStack Query)** - a library that fetches data for you and remembers loading, error and cached results.
> - **TanStack Table** - a headless table library: it works out rows and columns and draws nothing.
> - **Headless** - does the logic, leaves the HTML to you.
> - **shadcn/ui** - styled React components you copy into your own project, like `Table` and `Badge`.

## The big picture

> [!TLDR]
> A data table is three things: the data, a list of columns, and a loop that draws rows.
> We build it in three steps: plain React first, then separate columns and cells, then React Query and TanStack Table.

Here is the task, the way an interviewer might say it.
"Here is a JSON file of positions a trading desk holds. Show them in a table."
That sounds tiny.
The interview is really about how you split the work, and whether your code is easy to grow.

> [!ANALOGY]
> Think of a research desk.
> The data is the raw feed, the columns are the desk's standard read-out format, and the cells are how one field actually gets printed - a price, a sign, a currency symbol.
> Change how a price prints and the read-out format itself does not change.

Everything in this series starts from the same data.
Open it, skim the fields, and download it so you can follow along.

```json title="positions.json" download="positions.json"
[
  {
    "id": "pos_001",
    "symbol": "AAPL",
    "desk": "Equities",
    "trader": "R. Alvarez",
    "quantity": 5000,
    "priceCents": 22750,
    "dayPnlCents": 128500,
    "currency": "USD",
    "status": "open",
    "openedOn": "2026-06-02"
  },
  {
    "id": "pos_002",
    "symbol": "TSLA",
    "desk": "Equities",
    "trader": "J. Chen",
    "quantity": -1200,
    "priceCents": 24890,
    "dayPnlCents": -84300,
    "currency": "USD",
    "status": "open",
    "openedOn": "2026-07-15"
  },
  {
    "id": "pos_003",
    "symbol": "NVDA",
    "desk": "Equities",
    "trader": "S. Patel",
    "quantity": 3400,
    "priceCents": 122150,
    "dayPnlCents": 305600,
    "currency": "USD",
    "status": "open",
    "openedOn": "2026-08-01"
  },
  {
    "id": "pos_004",
    "symbol": "MSFT",
    "desk": "Rates",
    "trader": "R. Alvarez",
    "quantity": 2100,
    "priceCents": 41830,
    "dayPnlCents": 18900,
    "currency": "USD",
    "status": "closed",
    "openedOn": "2026-05-20"
  },
  {
    "id": "pos_005",
    "symbol": "JPM",
    "desk": "Credit",
    "trader": "M. Novak",
    "quantity": 8000,
    "priceCents": 19640,
    "dayPnlCents": null,
    "currency": "USD",
    "status": "open",
    "openedOn": "2026-09-19"
  },
  {
    "id": "pos_006",
    "symbol": "XOM",
    "desk": "Equities",
    "trader": "J. Chen",
    "quantity": -600,
    "priceCents": 11235,
    "dayPnlCents": 4100,
    "currency": "USD",
    "status": "open",
    "openedOn": "2026-04-11"
  },
  {
    "id": "pos_007",
    "symbol": "KO",
    "desk": "FX",
    "trader": "S. Patel",
    "quantity": 15000,
    "priceCents": 6280,
    "dayPnlCents": -900,
    "currency": "USD",
    "status": "open",
    "openedOn": "2026-03-30"
  },
  {
    "id": "pos_008",
    "symbol": "PFE",
    "desk": "Equities",
    "trader": "M. Novak",
    "quantity": 9000,
    "priceCents": 2940,
    "dayPnlCents": -1200,
    "currency": "USD",
    "status": "closed",
    "openedOn": "2026-02-14"
  },
  {
    "id": "pos_009",
    "symbol": "DIS",
    "desk": "FX",
    "trader": "R. Alvarez",
    "quantity": 4200,
    "priceCents": 11475,
    "dayPnlCents": 2600,
    "currency": "USD",
    "status": "open",
    "openedOn": "2026-08-25"
  },
  {
    "id": "pos_010",
    "symbol": "AMZN",
    "desk": "Equities",
    "trader": "J. Chen",
    "quantity": 1800,
    "priceCents": 19560,
    "dayPnlCents": 15400,
    "currency": "USD",
    "status": "open",
    "openedOn": "2026-09-10"
  },
  {
    "id": "pos_011",
    "symbol": "META",
    "desk": "Equities",
    "trader": "S. Patel",
    "quantity": -900,
    "priceCents": 61200,
    "dayPnlCents": -22700,
    "currency": "EUR",
    "status": "open",
    "openedOn": "2026-07-02"
  },
  {
    "id": "pos_012",
    "symbol": "GOOGL",
    "desk": "Rates",
    "trader": "M. Novak",
    "quantity": 2600,
    "priceCents": 17820,
    "dayPnlCents": null,
    "currency": "GBP",
    "status": "open",
    "openedOn": "2026-09-19"
  }
]
```

Notice three choices in that file.
Money is `priceCents`, a whole number, because decimals like `0.1 + 0.2` do not add up exactly in JavaScript.
Quantity is a signed number, so a short position like `-1200` reads as a negative, not as text like "(1,200)".
`dayPnlCents` is sometimes `null`, for a position opened too recently to have a previous close to compare against.

Table: each row is something the interviewer is quietly checking, and how you show it.

| They check      | How you show it                                         |
| --------------- | ------------------------------------------------------- |
| Types first     | You write a `Position` type before any JSX              |
| Separation      | Columns, cells and data loading live in different files |
| Real states     | You handle loading, error and "no rows"                 |
| Money and signs | You format them with `Intl`, never by hand              |

Start with the type, because every other file leans on it.

```ts title="types.ts"
export type Desk = "Equities" | "FX" | "Rates" | "Credit";
export type PositionStatus = "open" | "closed";

export type Position = {
  id: string;
  symbol: string;
  desk: Desk;
  trader: string;
  quantity: number; // positive is long, negative is short
  priceCents: number;
  dayPnlCents: number | null; // null until there is a previous close to compare
  currency: "USD" | "EUR" | "GBP";
  status: PositionStatus;
  openedOn: string; // YYYY-MM-DD
};
```

> [!RECAP]
>
> - A data table is data, plus columns, plus a loop that draws rows.
> - Store money as whole cents, keep quantity signed, and let a P&L be `null` before there is a previous close.
> - Write the `Position` type first; everything else uses it.

## Step 1: get rows on screen with plain React

> [!TLDR]
> Interviews often start with "no libraries".
> Load the JSON, keep it in state, and map it to `<tr>` elements.

In a real app the data comes from a server.
We fake one with a tiny `api.ts` that waits a moment, so loading states are real.

```ts title="api.ts"
import positions from "./positions.json";
import type { Position } from "./types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchPositions = async (): Promise<Position[]> => {
  await wait(400);

  return positions as Position[];
};
```

> [!THINK]
> Before you open the code, answer these in your head.
> What three things can the screen be showing while data loads? (Hint: not just "the rows".)
> Where does the list of rows live, and what sets it?
> What should each `<tr>` use as its `key`?

```tsx title="plain-position-table.tsx"
import { useEffect, useState } from "react";
import { fetchPositions } from "./api";
import type { Position } from "./types";

export const PlainPositionTable = () => {
  const [rows, setRows] = useState<Position[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");

  useEffect(() => {
    let cancelled = false;

    fetchPositions()
      .then((data) => {
        if (!cancelled) {
          setRows(data);
          setStatus("done");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === "loading") return <p>Loading positions…</p>;
  if (status === "error") return <p role="alert">Could not load positions.</p>;
  if (rows.length === 0) return <p>No positions yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Symbol</th>
          <th>Quantity</th>
          <th>Price</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((position) => (
          <tr key={position.id}>
            <td>{position.symbol}</td>
            <td>{position.quantity}</td>
            <td>{(position.priceCents / 100).toFixed(2)}</td>
            <td>{position.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

It works.
But look at what is tangled together: fetching, loading states, the header list, and how each value is drawn all live in one component.
Adding one column means editing two places, the `<th>` and the `<td>`.
That is the smell the next step fixes.

> [!NUANCE]
>
> - Use `position.id` as the key, never the array index. Once you sort or filter, index `0` points at a different position, and React reuses the wrong row.

> [!INTERVIEW]-
> Say the `cancelled` flag out loud.
> It stops a slow response from updating a component that has already gone away.
> Interviewers listen for that; it shows you know effects can outlive the screen.

> [!RECAP]
>
> - Handle three states before drawing rows: loading, error and empty.
> - Key rows by `id`, never by index.
> - One big component mixes fetching, headers and cell drawing; that is what we split next.

## Step 2: a columns file and a cells file

> [!TLDR]
> Put "what columns exist" in `columns.tsx` and "how one value looks" in `cells.tsx`.
> Then adding a column is one object, and changing how a P&L looks is one component.

A **column definition** answers three questions: what is the header, how do I read the value, and how do I draw it.
TanStack Table gives you a typed helper for writing them.

Start with the cells.
Each one is a tiny component that knows nothing about tables.

> [!THINK]
> How would you show `-1200` shares so a trader instantly reads it as short, not just a small number?
> Which built-in browser tool formats money and signed numbers for any locale?
> Why print an explicit `+` or `-` on a P&L that is already colour-coded?

```tsx title="cells.tsx"
import type { PositionStatus } from "./types";

const quantityFormat = new Intl.NumberFormat("en-US", {
  signDisplay: "exceptZero",
});

export const QuantityCell = ({ value }: { value: number }) => (
  <span className="tabular-nums">{quantityFormat.format(value)}</span>
);

const moneyFormat = (currency: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency });

export const MoneyCell = ({
  cents,
  currency,
}: {
  cents: number;
  currency: string;
}) => (
  <span className="tabular-nums">
    {moneyFormat(currency).format(cents / 100)}
  </span>
);

// Colour is never the only signal - a screen reader or a printout still needs the sign.
export const PnlCell = ({
  cents,
  currency,
}: {
  cents: number | null;
  currency: string;
}) => {
  if (cents === null) return <span className="tabular-nums">-</span>;

  const amount = moneyFormat(currency).format(Math.abs(cents) / 100);
  const sign = cents < 0 ? "-" : "+";

  return (
    <span className="tabular-nums" data-direction={cents < 0 ? "loss" : "gain"}>
      {sign}
      {amount}
    </span>
  );
};

const STATUS_LABEL: Record<PositionStatus, string> = {
  open: "Open",
  closed: "Closed",
};

export const StatusCell = ({ status }: { status: PositionStatus }) => (
  <span data-status={status}>{STATUS_LABEL[status]}</span>
);
```

Now the columns.
Each entry points at a field and hands it to a cell.

> [!THINK]
> The P&L needs two fields, `dayPnlCents` and `currency`.
> How can one column's cell reach the rest of the row?
> Why might you want the column's value to stay a plain signed number even though it shows as "-1,200"?

```tsx title="columns.tsx"
import { createColumnHelper } from "@tanstack/react-table";
import { MoneyCell, PnlCell, QuantityCell, StatusCell } from "./cells";
import type { Position } from "./types";

const column = createColumnHelper<Position>();

export const positionColumns = [
  column.accessor("symbol", { header: "Symbol" }),
  column.accessor("quantity", {
    header: "Quantity",
    // The value stays a signed number, so sorting later is numeric, not alphabetical.
    cell: ({ getValue }) => <QuantityCell value={getValue()} />,
  }),
  column.accessor("priceCents", {
    header: "Price",
    cell: ({ getValue, row }) => (
      <MoneyCell cents={getValue()} currency={row.original.currency} />
    ),
  }),
  column.accessor("dayPnlCents", {
    header: "Day P&L",
    cell: ({ getValue, row }) => (
      <PnlCell cents={getValue()} currency={row.original.currency} />
    ),
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusCell status={getValue()} />,
  }),
];
```

> [!GOTCHA]
> Here is a real bug that looks like a flaky button.
> A page built its columns inside the component so a "Close" cell button could call a page handler.
> Every render made a new columns array, TanStack rebuilt every cell, and React swapped the button out from under the user's mouse.
> The click landed on a button that no longer existed, so nothing happened.
> The fix: keep columns outside the component, and pass live handlers through the table's `meta` option, which cells can read when they draw.

> [!NUANCE]
>
> - The same rule applies to data. `data={positions ?? []}` creates a new empty array every render. Use a constant empty array instead.
> - `row.original` is your untouched `Position` object. Use it when one cell needs two fields, like `dayPnlCents` and `currency`.
> - From here on, every table feature is the same recipe: turn on one "row model" option and add one piece of state.

> [!INTERVIEW]-
>
> - _What does `getRowId` fix?_ Without it, TanStack names rows "0, 1, 2..." by position. Tick a row, sort the table, and a different position now looks ticked.

> [!RECAP]
>
> - Cells draw one value and know nothing about tables.
> - Columns say header, value and which cell to use.
> - Keep the columns array outside components so it stays the same object.

## Step 3: load with React Query, draw with TanStack Table

> [!TLDR]
> React Query replaces the `useEffect` fetching code with one hook.
> TanStack Table takes your data and columns and hands back rows ready to draw.

First, loading.
Compare the two tabs: same result, very different amount of code to get wrong.

> [!THINK]
> In Step 1 you tracked loading and error yourself.
> What else would you need to write to avoid fetching the same positions twice when two widgets need them?
> What should the "key" of this request be, so the library knows it is the same request?

```ts title="use-positions.ts" group="load" tab="React Query"
import { useQuery } from "@tanstack/react-query";
import { fetchPositions } from "./api";

export const usePositions = () =>
  useQuery({
    queryKey: ["positions"],
    queryFn: fetchPositions,
    staleTime: 60_000, // treat data as fresh for a minute
  });
```

```ts title="use-positions.ts" group="load" tab="useEffect"
import { useEffect, useState } from "react";
import { fetchPositions } from "./api";
import type { Position } from "./types";

// Everything React Query gives you, rebuilt by hand - and still no caching or retries.
export const usePositions = () => {
  const [data, setData] = useState<Position[] | undefined>();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchPositions()
      .then((rows) => !cancelled && setData(rows))
      .catch((e: Error) => !cancelled && setError(e));

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, error, isPending: !data && !error };
};
```

React Query needs one provider near the top of your app.

```tsx title="main.tsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { App } from "./app";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
);
```

Now drawing.
Put the hand-written loop from Step 1 next to the TanStack version.

> [!THINK]
> TanStack Table draws nothing.
> So what do you still write yourself?
> Which function turns a header or a cell into JSX using the `cell` you defined in `columns.tsx`?

```tsx title="position-table.tsx" group="draw" tab="TanStack Table"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { positionColumns } from "./columns";
import { usePositions } from "./use-positions";
import type { Position } from "./types";

const EMPTY: Position[] = []; // a stable empty array while loading

export const PositionTable = () => {
  const { data, isPending, error } = usePositions();

  const table = useReactTable({
    data: data ?? EMPTY,
    columns: positionColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (isPending) return <p>Loading positions…</p>;
  if (error) return <p role="alert">Could not load positions.</p>;

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => (
              <th key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext(),
                )}
              </th>
            ))}
          </tr>
        ))}
      </thead>
      <tbody>
        {table.getRowModel().rows.length === 0 ? (
          <tr>
            <td colSpan={positionColumns.length}>
              No positions match your filters.
            </td>
          </tr>
        ) : (
          table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};
```

```tsx title="position-table.tsx" group="draw" tab="Plain map"
import { positionColumns } from "./columns";
import { usePositions } from "./use-positions";

// Fine for an interview warm-up; you lose sorting, filtering and paging helpers.
export const PositionTable = () => {
  const { data, isPending, error } = usePositions();

  if (isPending) return <p>Loading positions…</p>;
  if (error || !data) return <p role="alert">Could not load positions.</p>;

  return (
    <table>
      <thead>
        <tr>
          {positionColumns.map((c) => (
            <th key={String(c.header)}>{String(c.header)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((position) => (
          <tr key={position.id}>
            <td>{position.symbol}</td>
            <td>{position.quantity}</td>
            <td>{position.priceCents / 100}</td>
            <td>{position.dayPnlCents}</td>
            <td>{position.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

The TanStack version never names a field.
Add another column in `columns.tsx` and this file does not change at all.
That is the whole point of the split.

> [!WIN]-
> You now have three small files with one job each: `use-positions.ts` loads, `columns.tsx` describes, `position-table.tsx` draws.
> Part 2 adds sorting, filtering and paging, and only touches the table options and one hook.

> [!RECAP]
>
> - React Query turns loading, errors and caching into one `useQuery` call with a key.
> - `useReactTable` needs data, columns and `getCoreRowModel`; you still write the HTML.
> - `flexRender` draws whatever the column's `header` or `cell` says.

## Optional: style it with shadcn

> [!TLDR]
> shadcn/ui gives you styled `Table` pieces and a `Badge`.
> Swap the raw HTML tags for them; the logic stays the same.

shadcn is not a package you install once.
You copy each component into your project, so you own and can change the code.

```bash title="terminal"
npx shadcn@latest add table badge
```

> [!THINK]
> Which tags in `position-table.tsx` map to `Table`, `TableHeader`, `TableRow`, `TableHead` and `TableCell`?
> Where should the colour of a status or a loss live now: in the table, or in the cell component?

```tsx title="position-table.tsx"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { positionColumns } from "./columns";
import { usePositions } from "./use-positions";
import type { Position } from "./types";

const EMPTY: Position[] = [];

export const PositionTable = () => {
  const { data, isPending, error } = usePositions();
  const table = useReactTable({
    data: data ?? EMPTY,
    columns: positionColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) return <p role="alert">Could not load positions.</p>;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => (
                <TableHead key={header.id}>
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {isPending ? (
            <TableRow>
              <TableCell colSpan={positionColumns.length}>
                Loading positions…
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
```

The status colour belongs in the cell, so only `cells.tsx` changes.

```tsx title="cells.tsx (StatusCell only)"
import { Badge } from "@/components/ui/badge";

const STATUS_VARIANT: Record<
  PositionStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "default",
  closed: "outline",
};

export const StatusCell = ({ status }: { status: PositionStatus }) => (
  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
);
```

> [!NUANCE]
>
> - A column's rendered width resolves as at least `minSize`, at most `maxSize`. If the whole table sets `defaultColumn: { minSize: 200 }`, a narrow column like Ccy needs its own `minSize` to shrink below that.
> - A sticky header row (`position: sticky`) does not carry a background colour of its own. Colour each header cell instead of the row, or rows will look like they scroll up behind the header text.
> - Keep the loading row inside the table instead of replacing the whole table. The header stays put, so the page does not jump when the data arrives.

> [!RECAP]
>
> - shadcn components are copied into your project with `npx shadcn add`.
> - Swap HTML tags for `Table*` pieces; TanStack logic does not change.
> - Column width and sticky headers are CSS details that live with the column or the cell, not the table's logic.

## Summary

> [!SUMMARY]
>
> - A data table is data, columns and a loop that draws rows.
> - Write the `Position` type first; store money as cents, keep quantity signed, and allow a `null` P&L.
> - Always handle loading, error and empty, and key rows by `id`.
> - `cells.tsx` draws one value; `columns.tsx` lists columns and picks cells.
> - React Query loads and caches with one `useQuery` and a key.
> - TanStack Table works out rows; `flexRender` and your HTML (or shadcn) draw them.

Next, in [Part 2](#/docs/sort-filter-paginate), we add sorting, filtering and pages to this exact table.

```quiz
[
  {
    "q": "A 'Close position' button inside a cell stops responding after any unrelated state in the parent updates. buildColumns({ onClose }) is called in the component body on every render. What is the most likely cause?",
    "options": [
      "A new columns array each render rebuilds and replaces the cell",
      "onClose is a stale closure captured when the table first mounted",
      "flexRender drops onClick handlers for buttons inside table cells",
      "getRowId is missing, so TanStack cannot find the row to close"
    ],
    "answer": 0,
    "expl": "TanStack tracks columns by object identity, so a fresh array each render forces a full rebuild and React drops the button the user was about to click. A stale closure would call the wrong handler rather than go silent, and flexRender renders whatever a cell returns without touching its event handlers."
  },
  {
    "q": "You need a Close button inside a cell to call the current onClose handler without a new columns array forming on every render. Which setup gets you both?",
    "options": [
      "Wrap buildColumns in useMemo with an empty dependency array",
      "Read the handler from table.options.meta at render time",
      "Store the handler in a module-level mutable variable",
      "Pass the handler down through each row's data object"
    ],
    "answer": 1,
    "expl": "Columns declared once outside the component keep a fixed identity, and meta gives every cell a place to read the current handler without rebuilding anything. A module-level variable is shared across every table instance and every request, which leaks one user's handler into another's table."
  },
  {
    "q": "A trader ticks three rows, then sorts the table by Day P&L. Three different positions now show as ticked. What was missing?",
    "options": [
      "A controlled rowSelection state object",
      "enableRowSelection set on the table options",
      "getRowId returning each position's own id",
      "A stable key on every table row element"
    ],
    "answer": 2,
    "expl": "Without getRowId, TanStack names a row by its place in the array, so sorting hands the tick to whatever position now sits at index 0, 4 or 7. A React key controls how the DOM gets reused; it does not change what TanStack thinks a row's identity is."
  },
  {
    "q": "The Ccy column sets size: 60, but the whole table also sets defaultColumn: { minSize: 200 }, and the column still renders 200px wide. What actually fixes just this column?",
    "options": [
      "Set maxSize: 60 on the column instead of size",
      "Lower the shared defaultColumn.minSize to 60",
      "Add a fixed-width class to the column's cells",
      "Set minSize: 60 on the Ccy column itself"
    ],
    "answer": 3,
    "expl": "Width resolves as at least minSize and at most maxSize, so the shared default of 200 wins until the column sets its own minSize. Lowering the shared default would shrink every other narrow column at the same time, not just this one."
  },
  {
    "q": "A blotter's header row uses position: sticky, but rows still appear to scroll up behind the header text. Which two changes actually fix it? Select all that apply.",
    "options": [
      "A max-height set on some unrelated parent wrapper",
      "A background colour on each header th cell",
      "A background colour on the sticky tr row itself",
      "The scroll happening inside the table's own wrapper div"
    ],
    "answer": [1, 3],
    "multi": true,
    "expl": "A sticky row does not carry a background colour of its own, so each th needs one, or the row text underneath shows through. The scroll container also has to be the table's own wrapper - a max-height on some unrelated ancestor never makes the header stick in the first place."
  },
  {
    "q": "The Day P&L column already colours losses red and gains green. Why does the cell still print an explicit + or - sign?",
    "options": [
      "Sorting would otherwise treat every value as positive",
      "So the number still reads correctly without relying on colour",
      "Intl.NumberFormat refuses to format a number with no sign",
      "tabular-nums needs a leading character to line digits up"
    ],
    "answer": 1,
    "expl": "Colour should never be the only signal - colour-blind readers, black-and-white printouts and screen readers all lose it, so the sign has to carry the meaning by itself. Sorting runs on the raw signed number from the accessor, not on the formatted string, so it never depended on the sign glyph anyway."
  },
  {
    "q": "The 'No positions match' row spans a hardcoded colSpan={5}. A trader then hides the Status column. What happens?",
    "options": [
      "TanStack recalculates the colSpan automatically",
      "The hidden column reappears to fill the leftover space",
      "Nothing, hidden columns still count toward the span",
      "The empty message overflows past the visible header"
    ],
    "answer": 3,
    "expl": "A hardcoded colSpan no longer matches four visible columns once one is hidden, so the cell stretches past where the header actually ends. Spanning table.getVisibleLeafColumns().length instead keeps it correct no matter which columns are shown."
  }
]
```

```related
[
  {
    "title": "Data Table",
    "url": "https://www.greatfrontend.com/questions/user-interface/data-table",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Medium",
    "note": "Build a table with pages in plain React - the interview version of Step 1."
  },
  {
    "title": "Column definitions guide",
    "url": "https://tanstack.com/table/latest/docs/guide/column-defs",
    "source": "TanStack Table docs",
    "kind": "read",
    "note": "Accessors, headers and cells - everything Step 2 uses, in depth."
  },
  {
    "title": "TanStack Query overview",
    "url": "https://tanstack.com/query/latest/docs/framework/react/overview",
    "source": "TanStack Query docs",
    "kind": "read",
    "note": "Why server data needs a cache, and what useQuery gives you."
  },
  {
    "title": "Data Table",
    "url": "https://ui.shadcn.com/docs/components/data-table",
    "source": "shadcn/ui",
    "kind": "read",
    "note": "The official shadcn guide that pairs its Table with TanStack Table."
  },
  {
    "title": "Intl.NumberFormat",
    "url": "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat",
    "source": "MDN",
    "kind": "read",
    "note": "The signDisplay and currency options QuantityCell and MoneyCell lean on."
  }
]
```
