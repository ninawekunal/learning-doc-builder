---
title: Your first data table - a finance walkthrough
summary: Take a small file of invoices and turn it into a real table, step by step, the way you would in a frontend interview.
date: 2026-09-17
part: 1
series: Data Tables in React
tags: [tanstack-table, react-query, shadcn, interviews]
minutes: 14
---

> [!TERMS]
>
> - **Data table** - a table on screen built from an array of objects, one object per row.
> - **Row** - one record on screen; here, one invoice.
> - **Column definition** - a small object that says how to read one value out of a row and how to draw it.
> - **Cell** - the small component that draws one value, like an amount or a status.
> - **Minor units** - money stored as whole cents, so `1250.50` dollars is saved as `125050`.
> - **React Query (TanStack Query)** - a library that fetches data for you and remembers loading, error and cached results.
> - **TanStack Table** - a headless table library: it works out rows and columns and draws nothing.
> - **Headless** - does the logic, leaves the HTML to you.
> - **shadcn/ui** - styled React components you copy into your own project, like `Table` and `Badge`.

## The big picture

> [!TLDR]
> A data table is three things: the data, a list of columns, and a loop that draws rows.
> We build it in three steps: plain React first, then separate columns and cells, then React Query and TanStack Table.

Here is the task, the way an interviewer might say it.
"Here is a JSON file of invoices. Show them in a table."
That sounds tiny.
The interview is really about how you split the work, and whether your code is easy to grow.

> [!ANALOGY]
> Think of a restaurant.
> The data is the ingredients, the columns are the menu, and the cells are the plates each dish is served on.
> If you change a plate, the menu should not have to change.

Everything in this series starts from the same data.
Open it, skim the fields, and download it so you can follow along.

```json title="invoices.json" download="invoices.json"
[
  {
    "id": "inv_001",
    "number": "INV-1001",
    "vendor": "Northwind Traders",
    "category": "Software",
    "amountCents": 125050,
    "currency": "USD",
    "status": "paid",
    "issuedOn": "2026-07-02",
    "dueOn": "2026-08-01"
  },
  {
    "id": "inv_002",
    "number": "INV-1002",
    "vendor": "Blue Harbor Logistics",
    "category": "Shipping",
    "amountCents": 842000,
    "currency": "USD",
    "status": "overdue",
    "issuedOn": "2026-06-15",
    "dueOn": "2026-07-15"
  },
  {
    "id": "inv_003",
    "number": "INV-1003",
    "vendor": "Atlas Office Supply",
    "category": "Office",
    "amountCents": 18999,
    "currency": "USD",
    "status": "open",
    "issuedOn": "2026-08-20",
    "dueOn": "2026-09-19"
  },
  {
    "id": "inv_004",
    "number": "INV-1004",
    "vendor": "Kestrel Cloud",
    "category": "Software",
    "amountCents": 560000,
    "currency": "EUR",
    "status": "open",
    "issuedOn": "2026-08-28",
    "dueOn": "2026-09-27"
  },
  {
    "id": "inv_005",
    "number": "INV-1005",
    "vendor": "Granite Legal LLP",
    "category": "Legal",
    "amountCents": 1200000,
    "currency": "USD",
    "status": "draft",
    "issuedOn": "2026-09-05",
    "dueOn": "2026-10-05"
  },
  {
    "id": "inv_006",
    "number": "INV-1006",
    "vendor": "Northwind Traders",
    "category": "Software",
    "amountCents": 125050,
    "currency": "USD",
    "status": "open",
    "issuedOn": "2026-09-02",
    "dueOn": "2026-10-02"
  },
  {
    "id": "inv_007",
    "number": "INV-1007",
    "vendor": "Sunrise Catering",
    "category": "Meals",
    "amountCents": 43275,
    "currency": "USD",
    "status": "paid",
    "issuedOn": "2026-08-11",
    "dueOn": "2026-08-25"
  },
  {
    "id": "inv_008",
    "number": "INV-1008",
    "vendor": "Maple Freight",
    "category": "Shipping",
    "amountCents": 310500,
    "currency": "CAD",
    "status": "overdue",
    "issuedOn": "2026-07-01",
    "dueOn": "2026-07-31"
  },
  {
    "id": "inv_009",
    "number": "INV-1009",
    "vendor": "Kestrel Cloud",
    "category": "Software",
    "amountCents": 560000,
    "currency": "EUR",
    "status": "paid",
    "issuedOn": "2026-07-28",
    "dueOn": "2026-08-27"
  },
  {
    "id": "inv_010",
    "number": "INV-1010",
    "vendor": "Atlas Office Supply",
    "category": "Office",
    "amountCents": 7450,
    "currency": "USD",
    "status": "void",
    "issuedOn": "2026-08-03",
    "dueOn": "2026-09-02"
  },
  {
    "id": "inv_011",
    "number": "INV-1011",
    "vendor": "Pinecrest Insurance",
    "category": "Insurance",
    "amountCents": 980000,
    "currency": "USD",
    "status": "open",
    "issuedOn": "2026-09-01",
    "dueOn": "2026-09-30"
  },
  {
    "id": "inv_012",
    "number": "INV-1012",
    "vendor": "Sunrise Catering",
    "category": "Meals",
    "amountCents": 21890,
    "currency": "USD",
    "status": "draft",
    "issuedOn": "2026-09-10",
    "dueOn": "2026-09-24"
  }
]
```

Notice two choices in that file.
Money is `amountCents`, a whole number, because decimals like `0.1 + 0.2` do not add up exactly in JavaScript.
Dates are plain `YYYY-MM-DD` strings, which sort correctly even as text.

Table: each row is something the interviewer is quietly checking, and how you show it.

| They check      | How you show it                                         |
| --------------- | ------------------------------------------------------- |
| Types first     | You write an `Invoice` type before any JSX              |
| Separation      | Columns, cells and data loading live in different files |
| Real states     | You handle loading, error and "no rows"                 |
| Money and dates | You format them with `Intl`, never by hand              |

Start with the type, because every other file leans on it.

```ts title="types.ts"
export type InvoiceStatus = "draft" | "open" | "paid" | "overdue" | "void";

export type Invoice = {
  id: string;
  number: string;
  vendor: string;
  category: string;
  amountCents: number;
  currency: "USD" | "EUR" | "CAD";
  status: InvoiceStatus;
  issuedOn: string; // YYYY-MM-DD
  dueOn: string; // YYYY-MM-DD
};
```

> [!RECAP]
>
> - A data table is data, plus columns, plus a loop that draws rows.
> - Store money as whole cents and dates as `YYYY-MM-DD`.
> - Write the `Invoice` type first; everything else uses it.

## Step 1: get rows on screen with plain React

> [!TLDR]
> Interviews often start with "no libraries".
> Load the JSON, keep it in state, and map it to `<tr>` elements.

In a real app the data comes from a server.
We fake one with a tiny `api.ts` that waits a moment, so loading states are real.

```ts title="api.ts"
import invoices from "./invoices.json";
import type { Invoice } from "./types";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchInvoices = async (): Promise<Invoice[]> => {
  await wait(400);

  return invoices as Invoice[];
};
```

> [!THINK]
> Before you open the code, answer these in your head.
> What three things can the screen be showing while data loads? (Hint: not just "the rows".)
> Where does the list of rows live, and what sets it?
> What should each `<tr>` use as its `key`?

```tsx title="plain-invoice-table.tsx"
import { useEffect, useState } from "react";
import { fetchInvoices } from "./api";
import type { Invoice } from "./types";

export const PlainInvoiceTable = () => {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [status, setStatus] = useState<"loading" | "error" | "done">("loading");

  useEffect(() => {
    let cancelled = false;

    fetchInvoices()
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

  if (status === "loading") return <p>Loading invoices…</p>;
  if (status === "error") return <p role="alert">Could not load invoices.</p>;
  if (rows.length === 0) return <p>No invoices yet.</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Number</th>
          <th>Vendor</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.number}</td>
            <td>{invoice.vendor}</td>
            <td>{(invoice.amountCents / 100).toFixed(2)}</td>
            <td>{invoice.status}</td>
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

> [!GOTCHA]
> Use `invoice.id` as the key, never the array index.
> Once you sort or filter, index `0` points at a different invoice, and React reuses the wrong row.

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
> Then adding a column is one object, and changing how money looks is one component.

A **column definition** answers three questions: what is the header, how do I read the value, and how do I draw it.
TanStack Table gives you a typed helper for writing them.

Start with the cells.
Each one is a tiny component that knows nothing about tables.

> [!THINK]
> How would you draw `125050` cents in `USD`?
> Which built-in browser tool formats money and dates for any country?
> Why keep status colours inside the cell, not the column?

```tsx title="cells.tsx"
import type { InvoiceStatus } from "./types";

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

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

// "2026-09-19" is read as UTC midnight; add T00:00 so it stays the same day everywhere.
export const DateCell = ({ value }: { value: string }) => (
  <time dateTime={value}>{dateFormat.format(new Date(`${value}T00:00`))}</time>
);

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  overdue: "Overdue",
  void: "Void",
};

export const StatusCell = ({ status }: { status: InvoiceStatus }) => (
  <span data-status={status}>{STATUS_LABEL[status]}</span>
);
```

Now the columns.
Each entry points at a field and hands it to a cell.

> [!THINK]
> The amount needs two fields, `amountCents` and `currency`.
> How can one column's cell reach the rest of the row?
> Why might you want the column's value to stay a plain number even though it shows as "$1,250.50"?

```tsx title="columns.tsx"
import { createColumnHelper } from "@tanstack/react-table";
import { DateCell, MoneyCell, StatusCell } from "./cells";
import type { Invoice } from "./types";

const column = createColumnHelper<Invoice>();

export const invoiceColumns = [
  column.accessor("number", { header: "Invoice" }),
  column.accessor("vendor", { header: "Vendor" }),
  column.accessor("amountCents", {
    header: "Amount",
    // The value stays a number, so sorting later is numeric, not alphabetical.
    cell: ({ getValue, row }) => (
      <MoneyCell cents={getValue()} currency={row.original.currency} />
    ),
  }),
  column.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusCell status={getValue()} />,
  }),
  column.accessor("dueOn", {
    header: "Due",
    cell: ({ getValue }) => <DateCell value={getValue()} />,
  }),
];
```

> [!NUANCE]+
> Define the columns array outside your component, like above.
> If you build it inside, it is a new array on every render, and TanStack redraws every cell each time.

> [!NUANCE]-
> `row.original` is your untouched `Invoice` object.
> Use it when one cell needs two fields.
> Keep the accessor pointed at the field you want to sort and filter by, which is why the amount column reads `amountCents` and not a formatted string.

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
> What else would you need to write to avoid fetching the same invoices twice when two components need them?
> What should the "key" of this request be, so the library knows it is the same request?

```ts title="use-invoices.ts" group="load" tab="React Query"
import { useQuery } from "@tanstack/react-query";
import { fetchInvoices } from "./api";

export const useInvoices = () =>
  useQuery({
    queryKey: ["invoices"],
    queryFn: fetchInvoices,
    staleTime: 60_000, // treat data as fresh for a minute
  });
```

```ts title="use-invoices.ts" group="load" tab="useEffect"
import { useEffect, useState } from "react";
import { fetchInvoices } from "./api";
import type { Invoice } from "./types";

// Everything React Query gives you, rebuilt by hand - and still no caching or retries.
export const useInvoices = () => {
  const [data, setData] = useState<Invoice[] | undefined>();
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchInvoices()
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

```tsx title="invoice-table.tsx" group="draw" tab="TanStack Table"
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { invoiceColumns } from "./columns";
import { useInvoices } from "./use-invoices";
import type { Invoice } from "./types";

const EMPTY: Invoice[] = []; // a stable empty array while loading

export const InvoiceTable = () => {
  const { data, isPending, error } = useInvoices();

  const table = useReactTable({
    data: data ?? EMPTY,
    columns: invoiceColumns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  if (isPending) return <p>Loading invoices…</p>;
  if (error) return <p role="alert">Could not load invoices.</p>;

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
            <td colSpan={invoiceColumns.length}>No invoices yet.</td>
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

```tsx title="invoice-table.tsx" group="draw" tab="Plain map"
import { invoiceColumns } from "./columns";
import { useInvoices } from "./use-invoices";

// Fine for an interview warm-up; you lose sorting, filtering and paging helpers.
export const InvoiceTable = () => {
  const { data, isPending, error } = useInvoices();

  if (isPending) return <p>Loading invoices…</p>;
  if (error || !data) return <p role="alert">Could not load invoices.</p>;

  return (
    <table>
      <thead>
        <tr>
          {invoiceColumns.map((c) => (
            <th key={String(c.header)}>{String(c.header)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((invoice) => (
          <tr key={invoice.id}>
            <td>{invoice.number}</td>
            <td>{invoice.vendor}</td>
            <td>{invoice.amountCents / 100}</td>
            <td>{invoice.status}</td>
            <td>{invoice.dueOn}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

The TanStack version never names a field.
Add a sixth column in `columns.tsx` and this file does not change at all.
That is the whole point of the split.

> [!WIN]-
> You now have three small files with one job each: `use-invoices.ts` loads, `columns.tsx` describes, `invoice-table.tsx` draws.
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
> Which tags in `invoice-table.tsx` map to `Table`, `TableHeader`, `TableRow`, `TableHead` and `TableCell`?
> Where should the colour of each status live now: in the table, or in `StatusCell`?

```tsx title="invoice-table.tsx"
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
import { invoiceColumns } from "./columns";
import { useInvoices } from "./use-invoices";
import type { Invoice } from "./types";

const EMPTY: Invoice[] = [];

export const InvoiceTable = () => {
  const { data, isPending, error } = useInvoices();
  const table = useReactTable({
    data: data ?? EMPTY,
    columns: invoiceColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (error) return <p role="alert">Could not load invoices.</p>;

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
              <TableCell colSpan={invoiceColumns.length}>
                Loading invoices…
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
  InvoiceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  open: "secondary",
  paid: "default",
  overdue: "destructive",
  void: "outline",
};

export const StatusCell = ({ status }: { status: InvoiceStatus }) => (
  <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
);
```

> [!NUANCE]-
> Keep the loading row inside the table instead of replacing the whole table.
> The header stays put, so the page does not jump when the data arrives.

> [!RECAP]
>
> - shadcn components are copied into your project with `npx shadcn add`.
> - Swap HTML tags for `Table*` pieces; TanStack logic does not change.
> - Status colours live in `StatusCell`, so styling stays in one place.

## Summary

> [!SUMMARY]
>
> - A data table is data, columns and a loop that draws rows.
> - Write the `Invoice` type first; store money as cents and dates as `YYYY-MM-DD`.
> - Always handle loading, error and empty, and key rows by `id`.
> - `cells.tsx` draws one value; `columns.tsx` lists columns and picks cells.
> - React Query loads and caches with one `useQuery` and a key.
> - TanStack Table works out rows; `flexRender` and your HTML (or shadcn) draw them.

Next, in [Part 2](#/docs/sort-filter-paginate), we add sorting, filtering and pages to this exact table.

```quiz
[
  {
    "q": "You store an invoice total as 1250.5 in a float and add many totals together. The finance team sees 0.01 differences. What change fixes the root cause?",
    "options": ["Round each total with toFixed(2) before adding it to the running sum", "Store amounts as whole cents and divide by 100 only when drawing", "Run parseFloat on every value as it comes back from the API", "Format each value with Intl.NumberFormat first, then add them"],
    "answer": 1,
    "expl": "Floats cannot store most decimals exactly, so errors pile up when adding. Whole cents are exact; divide only for display. Rounding or formatting first hides the error without removing it."
  },
  {
    "q": "After you sort the table, clicking a row's checkbox ticks a different invoice. What is the likely cause?",
    "options": ["The rows are keyed by array index", "The columns array is outside the component", "React Query cached the old data", "flexRender was not used for the header"],
    "answer": 0,
    "expl": "Sorting changes which invoice sits at index 0. With index keys, React reuses the old row's DOM and state for a different invoice. Key by the invoice id."
  },
  {
    "q": "A teammate adds a 'Category' column. In the TanStack version, which files should need to change?",
    "options": ["columns.tsx only", "columns.tsx and invoice-table.tsx", "invoice-table.tsx only", "use-invoices.ts and columns.tsx"],
    "answer": 0,
    "expl": "The table file loops over whatever columns exist and never names a field. A new column is one new entry in columns.tsx, plus a cell only if it needs special drawing."
  },
  {
    "q": "The Amount column shows '$1,250.50'. Which accessor setup keeps sorting correct later?",
    "options": ["Accessor returns the formatted string", "Accessor reads amountCents, and the cell formats it", "Accessor reads currency, and the cell reads amountCents", "No accessor; the cell reads row.original only"],
    "answer": 1,
    "expl": "Sorting and filtering use the accessor's value. A number sorts numerically; a formatted string sorts like text, so '$9' lands after '$10'. The cell handles the looks."
  },
  {
    "q": "Your table re-draws every cell on every keystroke in an unrelated search box on the page. Which change is the most likely fix?",
    "options": ["Move the columns array out of the component", "Switch from React Query to useEffect", "Add a key to the table element", "Store the data in a ref"],
    "answer": 0,
    "expl": "Columns built inside the component are a new array each render, so TanStack treats every column as new and redraws all cells. Defining them once outside keeps the same object."
  },
  {
    "q": "Which of these does React Query give you that the hand-written useEffect loader does not? Select all that apply.",
    "options": ["Sharing one request between two components that ask for the same key", "Caching results so coming back to the page is instant", "Automatic retries on failure", "Formatting money in the cells"],
    "answer": [0, 1, 2],
    "multi": true,
    "expl": "Deduplication, caching and retries come from the query key and the client. Formatting is the cell's job, not the loader's."
  },
  {
    "q": "In an interview, you have 10 minutes left and no libraries allowed. What should you make sure the plain table still does?",
    "options": ["Show loading, error and empty states, and key rows by id", "Add virtualization so long lists of rows scroll smoothly", "Split the code into separate columns.tsx and cells.tsx files", "Swap the status text for a coloured shadcn Badge component"],
    "answer": 0,
    "expl": "States and stable keys are the correctness basics interviewers check first. File splits and styling are nice, and virtualization is not needed for a dozen rows."
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
    "note": "Build a user table with pages in React - the interview version of Step 1."
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
  }
]
```
