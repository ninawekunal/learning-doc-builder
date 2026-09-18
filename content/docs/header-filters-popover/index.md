---
title: Header filters with a shadcn Popover
summary: Spreadsheet-style filters on the column title, built on one typed filter object and a draft that applies once.
date: 2026-09-17
part: 5
series: Data Tables in React
tags: [filters, shadcn, state-design]
minutes: 9
---

> [!TERMS]
>
> - **Header filter** - a filter you open by clicking a column's title, like in a spreadsheet.
> - **Popover** - a small floating panel that opens next to what you clicked.
> - **Draft** - your in-progress choices inside the popover, not yet applied.
> - **Commit / Apply** - turning the draft into the real filter the table uses.
> - **Chips** - small removable tags under the toolbar, one per active filter.
> - **aria-label** - an attribute that sets the name screen readers announce for a control.

## The big picture

> [!TLDR]
> Click a column title to filter it; a small separate button sorts it.
> Each popover keeps a draft and applies it once on "Apply".

![The Trade orders blotter with filterable column headers: each filterable title has a funnel and a separate sort button, and plain headers sit at the same height](./images/default.png "The orders table with filterable headers: each title has a funnel and its own small sort button.")

Everyone who has used a spreadsheet knows the move: click the column header, tick two values, done.
A header filter sits right where your eyes already are.
Nobody has to translate "this column" into "that field in a form".

> [!ANALOGY]
> A header filter is a shopping basket, not a vending machine.
> You gather what you want inside the popover, then pay once at the till.

This part covers the three decisions that make one header filter work.
[Part 6](#/docs/header-filters-ranges-and-url) then handles long lists, ranges, dates and the URL.

> [!NUANCE]-
> Header filters are the wrong tool for "working orders OR anything from my desk", because that crosses columns.
> Saved views are also wrong here; those belong in the toolbar.

> [!RECAP]
>
> - Filter from the column title; sort from a small separate button.
> - A popover drafts, then applies once.

## Decide the shape of the filters first

> [!TLDR]
> Before any UI, write one plain object with one key per thing a user can narrow.
> Only strings, numbers, lists of strings and `null`, so it survives a trip into a URL and back.

Most filter bugs start with state that grew one field at a time, in three places.
So we start with the type, not the popover.

> [!THINK]
> The table has Symbol, Status, Quantity and Submitted columns.
> Which of them need one value, a list, or a range?
> And what type should a date be, if it has to fit in a URL?

```ts title="order-filters.ts"
export type OrderFilters = {
  symbols: string[];
  statuses: OrderStatus[];
  quantityMin: number | null;
  quantityMax: number | null;
  submittedFrom: string | null; // "2026-09-17"
  submittedTo: string | null;
};
```

> [!NUANCE]-
>
> - Count active filters by group: a minimum and a maximum together count as one filter.
> - No `Date` objects in here. Dates are text; `Date` only exists inside the date picker.

> [!RECAP]
>
> - Design the filter object first: plain values only.
> - Count a min and max together as one filter.

## The filter header

> [!TLDR]
> One click target cannot mean both "sort" and "filter".
> Sorting is one click, so it can live on a small button.
> Filtering takes several steps, so it gets the big target: the title.

![Anatomy of a filter header: the title is the popover trigger, a funnel or count badge shows state, a separate icon-only sort button shows direction, and plain headers keep the same height](./images/header-anatomy.png "The four parts of a filter header: title, state, sort button, and plain headers at the same height.")

> [!STEPS]
>
> 1. **The title opens the popover.** The popover can close itself after Apply, and knows when it is open so it can load options.
> 2. **The funnel shows the state.** Grey when off; the title turns coloured with a count badge when on.
> 3. **Sort gets its own small button**, which shows the direction, because a column can be sorted and filtered at once.
> 4. **Each popover chooses where the cursor starts**, so keyboard users land on the right control.

> [!THINK]
> The title button already shows the word "Status".
> How would you tell a screen reader "filter, 2 active" without replacing that word?

```tsx title="filter-header.tsx"
<PopoverTrigger asChild>
  <Button variant="ghost" size="sm">
    {title}
    {count > 0 ? <Badge>{count}</Badge> : <FunnelIcon aria-hidden />}
    <span className="sr-only">, filter{count > 0 ? `, ${count} active` : ""}</span>
  </Button>
</PopoverTrigger>
<SortButton column={column} />
```

> [!GOTCHA]
> Do not add an `aria-label` to a button that already shows text.
> It replaces what screen readers and voice control hear, so "click Status" stops working.
> Add extra words in hidden text instead, so it reads "Status, filter, 2 active".

![Orders blotter with the Symbol popover open under its title, the sort icon button beside the title and the option list loaded](./images/symbol-popover-open.png "The Symbol filter open under its column title, with the full option list.")

> [!RECAP]
>
> - The title opens the filter; the funnel or badge shows whether it is on.
> - Do not override visible text with an aria-label.

## Draft, Apply, Clear

> [!TLDR]
> If every tick applied immediately, four ticks would mean four server requests and four Back-button steps.
> So each popover keeps a draft, applies it once, and throws it away on Escape or a click outside.

![Committing on every tick fires one request and one history entry per tick, while a draft that commits on Apply fires one request, and Escape or an outside click discards the draft by unmounting the body](./images/draft-apply-commit.png "Applying every tick sends a request each time; a draft sends one on Apply, and Escape throws it away.")

> [!THINK]
> Where should the draft live: in the page, or inside the popover body?
> When the popover closes and reopens, how does the draft get reset to the applied value?

```tsx title="symbol-filter-body.tsx"
const SymbolFilterBody = ({ applied, onApply, close }: Props) => {
  const [draft, setDraft] = useState(applied); // fresh on every open

  return (
    <>
      <SymbolList value={draft} onChange={setDraft} />
      <Button variant="ghost" onClick={() => setDraft([])}>
        Clear
      </Button>
      <Button
        onClick={() => {
          onApply(draft);
          close();
        }}
      >
        Apply
      </Button>
    </>
  );
};
```

No special reset code is needed.
The popover's content is removed when it closes, so next time it starts fresh from the applied filter.

![Symbol popover with two symbols ticked in the draft, not yet applied](./images/symbol-popover-two-picked.png "Two symbols ticked in the draft; nothing changes in the table until Apply.")

> [!NUANCE]-
>
> - A popover's "Clear" clears only its own draft. "Clear all" lives with the chips. Mixing them up confuses people.
> - Keep the popover content un-forced. Forcing it to stay mounted would keep the stale draft around.

![After Apply, the Symbol header shows a count badge and a chips row lists each applied value with a remove button and a Clear all link](./images/applied-badge-and-chips.png "After Apply: the header shows a count, and each value becomes a removable chip.")

> [!WIN]-
> Four ticks, one Apply, one request, one Back-button step.
> Escape throws the whole draft away without a line of reset code.

> [!RECAP]
>
> - Keep a draft, apply once, discard on Escape.
> - A popover Clear clears only its draft.

## Summary

> [!SUMMARY]
>
> - Write the filter object first, with plain values that fit in a URL.
> - Put filters on the column title and sorting on a small button.
> - Show filter state with a badge and hidden text, never an overriding aria-label.
> - Draft inside the popover, apply once, and let unmounting reset it.

```quiz
[
  {
    "q": "A column header is one button: click to sort, and a funnel opens the filter. Users keep sorting by accident. Best redesign?",
    "options": [
      "Title filters; a small button sorts",
      "Open the filter on right-click instead",
      "Require a double-click to sort the column",
      "Move both actions into a toolbar menu"
    ],
    "answer": 0,
    "expl": "A filter is multi-step and deserves the large target; a sort is one click and survives a small one. Right-click and double-click are undiscoverable."
  },
  {
    "q": "In a server-driven table, each checkbox tick in a filter popover commits immediately. What does the user notice?",
    "options": [
      "Checkboxes lag until the popover closes",
      "The popover closes after every tick",
      "Other headers lose their badges",
      "A request and a history entry per tick"
    ],
    "answer": 3,
    "expl": "Every commit is a request and a URL write, so four ticks mean four requests and four back-button stops. A draft committed on Apply sends one."
  },
  {
    "q": "A popover body initialises its draft from props with useState. Reopening it shows the applied value, with no reset effect. Why does that work?",
    "options": [
      "useState re-reads its initial value on every render",
      "The popover content unmounts when it closes",
      "Radix resets form fields on the close event",
      "The context value changes and forces a remount"
    ],
    "answer": 1,
    "expl": "Closing unmounts the body, so opening mounts it fresh and the initializer runs again. useState does not re-read its initial value, which is why forcing the body to stay mounted would break this."
  },
  {
    "q": "A popover's Clear button also clears every other column's filters. What is wrong with that?",
    "options": [
      "It fires too many requests at once",
      "Local clear and table-wide clear are different jobs",
      "Clear should only exist in the chips row",
      "It bypasses the URL validation step"
    ],
    "answer": 1,
    "expl": "Inside a popover, Clear resets that draft. Clearing everything belongs next to everything it clears, in the chips row, so a popover Clear is still correct when it stays local."
  },
  {
    "q": "A teammate adds aria-label=\"Filter status\" to the Status title button. What breaks?",
    "options": [
      "The popover no longer opens on Enter",
      "Voice users saying 'click Status' miss it",
      "The count badge stops rendering",
      "Focus skips the sort button"
    ],
    "answer": 1,
    "expl": "An aria-label replaces the visible text as the accessible name, so the spoken name no longer matches what users see. Hidden extra text adds words without replacing the title."
  },
  {
    "q": "Which belong in the filter object so it survives a URL round trip? Select all that apply.",
    "options": [
      "A list of status strings",
      "The date as text like 2026-09-17",
      "A Date object for the start day",
      "An onApply callback per column"
    ],
    "answer": [0, 1],
    "multi": true,
    "expl": "Strings, numbers, lists and null turn into URL text and back unchanged. A Date object or a function does not survive being written into a URL."
  },
  {
    "q": "The Quantity filter has a minimum and a maximum set. What should the 'All filters' count show for it?",
    "options": [
      "Two, one per bound",
      "Zero until both are valid",
      "One, for the range",
      "The number of matching rows"
    ],
    "answer": 2,
    "expl": "Users think of a range as one filter, so a min and max together count once. Counting each bound makes the badge disagree with the one chip the user sees."
  }
]
```

```related
[
  {
    "title": "Popover",
    "url": "https://ui.shadcn.com/docs/components/popover",
    "source": "shadcn/ui",
    "kind": "read",
    "note": "The component the header filters are built on."
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
    "note": "Add filtering to a generic table, then try moving it into the column headers."
  }
]
```
