---
title: Four kinds of task, four table shapes
summary: The dissection table changes its columns for a function spec, a UI, a bug report and a multi-stop pipeline; here is each one, worked.
date: 2026-09-17
part: 2
series: Dissecting Problem Statements
tags: [problem-solving, interviews, debugging]
topic: Interview prep
minutes: 15
---

> [!TERMS]
>
> - **Dissection table** - one row per verb, with three columns: verb, input, output.
> - **Builder** - a small object you call methods on one after another, like a chain.
> - **Closure** - a function that remembers the variables around it when it was created.
> - **Derived value** - something worked out during render from state, never stored in state.
> - **Comparator** - a tiny function that says which of two rows comes first.
> - **Repro (reproduction)** - the exact clicks that show a bug.
> - **Owning line** - the single line of code responsible for a behaviour.
> - **Handoff** - the one thing a step passes to the next step in a chain.
> - **Invariant** - something that must stay true the whole time.

## Type A: implement a function

[Part 1](#/docs/dissecting-problems-the-method) built the seven-step method on one statement.
Now we see that the table's columns change with the kind of task.

Table: each row is one statement type and the three columns its table uses.

| Type       | Column 1      | Column 2                 | Column 3           |
| ---------- | ------------- | ------------------------ | ------------------ |
| A function | method name   | what it takes in         | what it hands back |
| B UI       | user action   | the one state it changes | what re-renders    |
| C bug      | repro step    | the code path it runs    | the owning line    |
| D pipeline | stop and verb | its input                | the handoff        |

> [!TLDR]
> For a function spec, the rows are the method names.
> Every other sentence in the spec is either a row or an invariant.

> [!ANALOGY]
> A function spec is a vending machine manual.
> Each button (method) takes something in (coins) and drops one thing out (a can); the "never" rules tell you how the inside is built.

Here is an API-client spec, a common take-home question.

> "Implement createAPI(baseURL). It returns an object with url(path). url(path) returns a fresh request builder with setHeaders(headers), get(), and post(body). Resolve URLs with new URL(path, baseURL). get() and post() return the raw fetch promise. Multiple setHeaders calls merge, later values overwrite earlier ones. post(body) forwards the body as given. Each url(path) call creates a fresh builder."

The verbs: implement, returns, returns, resolve, return, merge, forwards, creates.
Four of the eight are "return", which tells you this is a chain of small machines.

```text title="notes.md - api client table" open
verb        -> input                  -> output
-----------------------------------------------------------------
createAPI   -> a base address         -> an object with url() on it
url         -> a path like "/posts"   -> a fresh builder, nothing shared
resolve     -> path + base            -> one absolute address, as a string
setHeaders  -> an object of headers   -> the same builder, headers merged
get         -> nothing                -> the raw promise from fetch
post        -> an optional body       -> the raw promise from fetch
```

The constraints come out next:

- **Must** use `new URL(path, baseURL)`, not string joining.
- **Must not** call `.json()` or check the status inside get or post.
- **Must not** let headers leak from one builder into the next. That is an invariant.
- **Only** these methods: no query params, no retries, no interceptors.

> [!THINK]
> "Each call creates a fresh builder" and "headers must not leak" are the same rule.
> Where can the headers live so that two builders can never see each other's?
> What should `setHeaders` return so the calls can chain?

```ts title="create-api.ts"
url(path) {
  const target = new URL(path, baseURL).toString(); // row: resolve
  let headers = {}; // the invariant lives here

  const builder = {
    setHeaders(next) {
      headers = { ...headers, ...next };
      return builder;
    },
    get() {
      return fetch(target, { method: "GET", headers });
    },
    post(body) {
      return fetch(target, { method: "POST", headers, body });
    },
  };

  return builder;
}
```

- `target` and `headers` are created inside `url()`, so each call gets its own pair.
- `{ ...headers, ...next }` is the "merge, later wins" row in one expression.
- `return builder` makes the chain work; it returns the captured object, not `this`.
- Neither get nor post touches the response, because the output column said "raw promise".

A second, tiny example: debounce.

> "debounce(fn, wait) returns a function. Calling it repeatedly resets a timer. fn runs once, wait milliseconds after the LAST call, with the last call's arguments and this."

```text title="notes.md - debounce table" open
verb     -> input                    -> output
--------------------------------------------------------------
returns  -> a function and a delay   -> a new wrapper function
resets   -> each call while waiting  -> a timer, started again from zero
runs     -> the quiet period ending  -> one call to fn
forwards -> the last args and this   -> those exact values, passed through
```

The fourth row is the one people drop.
It is why the wrapper must be a plain `function`, not an arrow: an arrow has no `this` of its own to forward.

> [!NUANCE]-
>
> - "Each call creates a fresh X" always means a closure or a new instance, never "reset a shared variable".
> - "Returns the raw promise" tells you what NOT to add. Being helpful fails the test.
> - Example calls in a spec are the acceptance criteria. If prose and example disagree, follow the example.
> - `new URL('/posts', 'https://x.com/api/')` gives `/posts`, not `/api/posts`: a leading slash replaces the base path.

> [!INTERVIEW]-
>
> - _Why a closure and not a field on the api object?_ Two builders in flight would share one header bag.
> - _Does fetch reject on a 404?_ No. It resolves with `ok === false`; only a network failure or abort rejects.
> - _Debounce or throttle for a search box?_ Debounce: it waits for silence. Throttle sends half-typed queries.

> [!RECAP]
>
> - For a function, one row per method; fill inputs from the parentheses and outputs from the return sentence.
> - Words like "never", "each" and "fresh" are invariants, and invariants decide where state lives.
> - Check your table against the example calls; examples outrank prose.

## Type B: build a UI

> [!TLDR]
> For a UI the columns become: user action, the one state it changes, what re-renders.
> Anything not in the state column is derived during render.

Here is a generic data-table task.

> "Build a table that works for any dataset, driven by a columns config. Support pagination, sortable column headers, and per-column filtering. Clicking a sortable header cycles none, ascending, descending. Filtering runs before sorting, and pagination runs last. Changing a filter or the page size resets the page to one."

The verbs: build, support, cycles, runs, runs, resets.
Three of them are about ORDER, not about a click, which tells you there is a pipeline inside this UI.

```text title="notes.md - data table, UI flavour" open
user action        -> state it changes        -> what re-renders
--------------------------------------------------------------------------
type in a filter   -> filters[key], page = 1  -> fewer rows, footer count
click a header     -> sort = {key, dir}       -> reordered rows, arrow icon
click Next         -> page = page + 1         -> the next slice of rows
change page size   -> pageSize, page = 1      -> a longer or shorter slice
(no action)        -> nothing                 -> pageCount, start, visible rows
```

The last row has no action and no state.
That is the derived row, and writing it down is what stops you storing the filtered list in state.

The constraints:

- **Order is fixed:** filter, then sort, then paginate.
- **Must** reset the page to one when filters, sort or page size change.
- **Must not** mutate the incoming rows; `Array.prototype.sort` sorts in place, so copy first.
- **Only** four pieces of state exist: sort, filters, page, pageSize.

> [!THINK]
> The table says filter, then sort, then paginate.
> Which of those steps is cheap enough to live outside a memo?
> What goes wrong if you sort the rows you were handed without copying them?

```tsx title="data-table.tsx"
const visible = useMemo(() => {
  let out = rows.filter((r) => matchesEveryFilter(r)); // 1. filter
  if (sort) out = [...out].sort(cmpFor(sort)); // 2. sort a COPY

  return out;
}, [rows, columns, filters, sort]);

const pageRows = visible.slice((page - 1) * pageSize, page * pageSize); // 3. paginate
```

- Filter first, so the sort has fewer rows to walk.
- `[...out]` copies before sorting, because sort rewrites the array it is given.
- The dependency list names everything the pipeline reads; miss `filters` and you get stale rows.
- Sorting after slicing would sort only the visible page. That is the classic bug this order prevents.

> [!NUANCE]-
>
> - If a value can be computed from state, it is not state. Storing it means keeping two truths in sync.
> - "Resets to page one" couples two states. Write it in the same click handler, never as an effect.
> - "For any dataset" means a config object is required, not optional. It is a row.
> - Accessibility is usually implied, not written: `aria-sort` on the header, a label on the select. Graders look.

> [!INTERVIEW]-
>
> - _What is your state shape?_ Read the state column aloud. Four values, nothing derived.
> - _Why filter before sort?_ Less work to sort, and sorting last would only sort one page.
> - _How would this work server-side?_ Page, sort and filters go to the API, and the previous page stays visible while loading.

> [!RECAP]
>
> - One row per thing the user can do, each naming ONE state change.
> - Add a "no action" row for derived values so you never store them.
> - Order words (before, after, then, last) define a pipeline with one correct sequence.

## Type C: fix a bug

> [!TLDR]
> A bug report has no verbs for you to build; its verbs are the user's clicks.
> The columns become: repro step, the code it runs, the one line that owns the behaviour.

Here is a bug from a frontend take-home with seven planted bugs.

> "Approving a transaction does not persist. Select an employee, approve one of their transactions, switch the filter back to All Employees, then select that employee again. The transaction shows as unapproved. Expected: it stays approved."

```text title="notes.md - approval bug table" open
repro step          -> code path it runs           -> owning line / suspect
------------------------------------------------------------------------------
select an employee  -> loadTransactionsByEmployee  -> fetchWithCache(...)
tick the checkbox   -> onChange -> setApproval     -> setApproved(newValue), local
                                                      state in TransactionPane
server receives it  -> requests.ts mutates data    -> transaction.approved = value
switch to All       -> panes unmount               -> local state is thrown away
select again        -> same fetch, same cache key  -> cache returns the OLD json
row renders         -> prop transaction.approved   -> stale value, unticked box
```

There are two owning lines, not one.
The local state is lost AND the cache is stale.
Fix only the first and the box still resets, because the refetched prop is also wrong.
A row per step is what exposes the second cause.

Table: each row is a moment in the repro, with what should happen next to what does happen.

| Step                 | Expected                   | Actual                        |
| -------------------- | -------------------------- | ----------------------------- |
| after the tick       | box ticked, server updated | box ticked, server updated    |
| after switching away | nothing visible            | local state quietly discarded |
| after switching back | box still ticked           | box empty again               |

The first row where the two columns disagree is where your breakpoint goes.
Here that is the third row, which points at the refetch, not the checkbox.

> [!THINK]
> The server already stored the change.
> So what is lying when the list comes back: the checkbox, or the cache?
> What should happen to cached reads right after a write?

```ts title="transaction-pane.ts"
await fetchWithoutCache("setTransactionApproval", {
  transactionId,
  value: newValue,
});
clearCacheByEndpoint(["paginatedTransactions", "transactionsByEmployee"]);
```

- The write skips the cache, because a write must always reach the server.
- Clearing the two list endpoints means the next read asks the server again.
- Clear by endpoint, not everything: a full clear also drops the employee list and causes a loading flash.
- Keep the local tick for instant feedback; the refetch then confirms it.

> [!WIN]-
> "The server persisted it. My cache lied. So I invalidate on write."
> That is the whole bug in three short sentences, and the same rule React Query users apply after a mutation.

> [!NUANCE]-
>
> - Read every bug in a list before fixing one. In this take-home, this bug cannot even be reproduced until three others are fixed.
> - Two symptoms in one report usually mean two causes.
> - "Not visible" means removed from the DOM. Disabling a button is a weaker answer.
> - Speed up your own loop first: this take-home read a `?timeout=200` URL param that made its fake requests five times faster.

> [!INTERVIEW]-
>
> - _How do you debug code you did not write?_ Reproduce first, follow the data, then name one owning line.
> - _Why not sync the prop into state with an effect?_ The prop is stale too; syncing to a lie changes nothing.
> - _Local state or server state?_ If a server can change it, the server owns it and the client caches a copy.

> [!RECAP]
>
> - Number the repro steps exactly as written, one row each.
> - Put expected and actual side by side; debug where they first disagree.
> - Re-run the exact repro after the fix: proof, not a feeling.

## Type D: a multi-stop pipeline

> [!TLDR]
> A multi-stop task is a chain where each stop hands exactly one thing to the next.
> Carry that one thing, and forget the rest.

Here is a multi-stop puzzle from a hiring challenge.

> "Decode the base64 string on the application form to get a URL. Open it to read the instructions. Extract one character per matching node, in document order, and join them into a second URL. Open that URL to get the flag word. Build a small React app that fetches the word and typewrites it. Submit the flag and a public link."

```text title="notes.md - puzzle stops" open
stop  verb      -> input                   -> output (the handoff)
------------------------------------------------------------------
1     decode    -> a scrambled string      -> address 1
2     open      -> address 1               -> the instructions page
3     extract   -> that page's HTML        -> one long string of characters
4     open      -> that string as a URL    -> one English word
5     build     -> that word's URL         -> one public sandbox link
6     submit    -> the word and the link   -> a sent application
```

Six stops, six handoffs.
The output of stop 3 is the input of stop 4 and nothing else.
Once you have the word, the HTML puzzle is dead weight.

Stop 3 hides a trap.
The brief's comment says the article id "ends with 33", but its example id is `ndd6l335`, which only CONTAINS 33.
The written pattern is `*33*`, meaning contains, so you follow the example.

> [!THINK]
> CSS attribute selectors have starts-with, ends-with and contains forms.
> Which form matches `ndd6l335`?
> Why would reading `.value` on a paragraph give you nothing?

```js title="devtools console"
[
  ...document.querySelectorAll(
    'section[id^="11"] main[id$="22"] article[id*="33"] p.flag',
  ),
]
  .map((p) => p.getAttribute("value"))
  .join("");
```

- `[id^="11"]` is starts-with, `[id$="22"]` is ends-with, `[id*="33"]` is contains.
- Spaces between the parts mean "anywhere inside", which matches "zero or more nodes between".
- `p.flag` matches a class among others; `[class="flag"]` would demand an exact match and miss rows.
- `getAttribute('value')` because `.value` is only a real property on form elements.
- `querySelectorAll` returns nodes in document order, which is what "in order" asked for.

The same shape fits ordinary work, like a CI paragraph in a README.

> "On every push, the workflow installs dependencies from the lockfile, runs typecheck and lint in parallel, then runs the unit suite, and finally uploads the coverage report. A failing typecheck skips the remaining jobs. Only pushes to main publish the build artifact."

```text title="notes.md - CI table" open
verb       -> input                  -> output (the handoff)
----------------------------------------------------------------
installs   -> the lockfile           -> a ready node_modules folder
runs       -> the source files       -> two pass/fail results, at once
runs       -> source plus deps       -> a test result and coverage data
uploads    -> that coverage data     -> a report stored on the run
skips      -> a failed typecheck     -> (no output: this is a branch)
publish    -> a build on main only   -> an artifact, sometimes
```

Two words did all the damage.
"In parallel" means those two rows share one input and neither feeds the other.
"Only" means the last row is a branch, not a guaranteed step.

> [!STEPS]-
>
> 1. **Number the stops first.** Count them out loud: that is how many things must go right.
> 2. **Write each handoff in four words or fewer.** "address 1", "one word".
> 3. **Mark the branches.** Words like only, if, unless.
> 4. **Mark what runs at the same time.** "In parallel" means no handoff between them.
> 5. **Verify each handoff before moving on.** A wrong output at stop 3 wastes every stop after it.

> [!NUANCE]-
>
> - Verify cheaply: here the second URL's path is hex text, so a decodable path proves stop 3 worked.
> - A stop can fail for an environment reason: fetching the page from a sandbox is blocked by a browser safety rule, so run the selector on the page itself.
> - Puzzles like this rotate. Learn the method; a copied answer is easy to detect.
> - Once a handoff is captured, write it somewhere permanent. Re-deriving a lost string is the most common wasted hour.

> [!INTERVIEW]-
>
> - _How do you handle a long multi-step task?_ One handoff per step, verified before moving on.
> - _Why a selector instead of a recursive walk?_ Document order is guaranteed and nothing is counted twice.
> - _What did you verify?_ Name your checkpoints. Interviewers score verification, not just the answer.

> [!RECAP]
>
> - Each stop hands exactly one thing to the next; carry only that.
> - "Only" marks a branch and "in parallel" marks no handoff.
> - When the example and the prose disagree, follow the example.

## Summary

> [!SUMMARY]
>
> - Function specs: one row per method; "fresh", "each" and "never" decide where state lives.
> - UIs: action, one state change, what re-renders, plus a "no action" row for derived values.
> - Bugs: repro step, code path, owning line; debug where expected and actual first disagree.
> - Pipelines: one handoff per stop, branches and parallel steps marked, each handoff verified.
> - Across all four, examples outrank prose.

Next, [Part 3](#/docs/dissecting-problems-traps-and-drills) covers the six ways a statement lies to you, then twelve drills.

```quiz
[
  {
    "q": "An API spec says: \"Each url(path) call creates a fresh request builder.\" What does that sentence actually decide?",
    "options": ["Where the headers are stored, so they cannot leak", "That url must be called before get or post", "How the path and the base are joined together", "That get and post return the untouched promise"],
    "answer": 0,
    "expl": "\"Fresh\" is an invariant, and invariants decide where state lives: headers go in the closure that url creates. Calling order and return values come from other sentences in the same spec."
  },
  {
    "q": "You are dissecting a \"build a UI\" statement. What should the three columns be?",
    "options": ["component name, its props, and its styles", "verb, the input given, the value returned", "user action, the state changed, what re-renders", "event name, the handler run, the data fetched"],
    "answer": 2,
    "expl": "For a UI the useful chain is what the user does, the one value that changes, and what looks different afterwards. Verb, input, output is the generic form and hides the state question, which is the one graders ask about."
  },
  {
    "q": "A README says: filter, then sort, then paginate. A teammate slices the page first and sorts what is left. What breaks?",
    "options": ["Nothing breaks, since sorting is stable anyway", "Only the rows on the current page get sorted", "The filters stop applying after the first page", "The page count is computed from the wrong list"],
    "answer": 1,
    "expl": "Sorting after slicing only reorders the visible rows, so page two still holds the same rows it always did. Stability is about equal keys and has nothing to do with this."
  },
  {
    "q": "In the approval bug, the row shows unapproved after a refetch. Which row of the bug table names the second cause?",
    "options": ["the tick, which only set state inside one pane", "the switch away, which unmounted every pane", "the server call, which did store the new value", "the refetch, which the old cache answered again"],
    "answer": 3,
    "expl": "Two causes stack: local state is lost, and the cache replays stale JSON, so even the fresh prop is wrong. Fixing only the unmount leaves the box empty."
  },
  {
    "q": "Your bug table has a repro step whose expected and actual columns agree. What does that tell you?",
    "options": ["That step is fine, so look further down the list", "That step is where you should set your breakpoint", "The report is wrong and the bug does not exist", "You must re-run the whole repro from the start"],
    "answer": 0,
    "expl": "You want the first row where the two columns disagree, because everything above it works. A matching row is evidence, not the blast point."
  },
  {
    "q": "A brief says an id \"ends with 33\", writes the pattern as *33*, and shows the example id ndd6l335. What do you do?",
    "options": ["Match ids ending in 33, since the prose says so", "Match both ends-with and contains, just in case", "Match ids containing 33, since the example does", "Skip that level and match the leaf nodes only"],
    "answer": 2,
    "expl": "Examples outrank prose, because the example is what the grader's data looks like. Matching ends-with drops characters and the rebuilt address fails."
  },
  {
    "q": "Which of these belong in a data-table component's state, rather than being derived? Select all that apply.",
    "options": ["The current page number the user is on", "The active sort column and its direction", "The filtered and sorted list of rows", "The total number of pages to show"],
    "answer": [0, 1],
    "multi": true,
    "expl": "Page and sort change only when the user acts, so they are state. The filtered list and the page count can be computed from state during render, so storing them means keeping two truths in sync."
  },
  {
    "q": "A CI README says typecheck and lint run \"in parallel\", and \"only pushes to main publish\". What do those two words tell you? Select all that apply.",
    "options": ["Typecheck and lint pass nothing to each other", "Publishing is a branch, not a guaranteed step", "Lint must wait for the typecheck to finish", "Every push produces a published artifact"],
    "answer": [0, 1],
    "multi": true,
    "expl": "Parallel steps share an input and hand nothing between them, and \"only\" turns a step into a branch. Waiting for typecheck or publishing on every push reads the sentence as one flat list."
  }
]
```

```related
[
  {
    "title": "API Client",
    "url": "https://www.greatfrontend.com/questions/javascript/api-client",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Medium",
    "note": "The Type A example: dissect it, then build the closure."
  },
  {
    "title": "Data Table IV",
    "url": "https://www.greatfrontend.com/questions/user-interface/data-table-iv",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Hard",
    "note": "The Type B example: filter, sort and paginate in that order."
  },
  {
    "title": "Invalidations from mutations",
    "url": "https://tanstack.com/query/latest/docs/framework/react/guides/invalidations-from-mutations",
    "source": "TanStack Query docs",
    "kind": "read",
    "note": "The library version of the Type C fix: invalidate on write."
  },
  {
    "title": "Attribute selectors",
    "url": "https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors",
    "source": "MDN",
    "kind": "read",
    "note": "Starts-with, ends-with and contains, as used in the Type D selector."
  },
  {
    "title": "URL() constructor",
    "url": "https://developer.mozilla.org/en-US/docs/Web/API/URL/URL",
    "source": "MDN",
    "kind": "read",
    "note": "Why a leading slash replaces the base path."
  }
]
```
