---
title: Six traps and twelve drills
summary: The six ways a problem statement hides requirements from you, then twelve fresh statements to dissect with the answers folded away.
date: 2026-09-17
part: 3
series: Dissecting Problem Statements
tags: [problem-solving, interviews, practice]
topic: Interview prep
minutes: 16
---

> [!TERMS]
>
> - **Dissection table** - one row per verb, with three columns: verb, input, output.
> - **Constraint** - a rule about how, not a step; it never produces a thing.
> - **Passive voice** - a sentence where the doer is hidden, like "characters are collected".
> - **Acceptance criteria** - the list a grader ticks to decide whether you passed.
> - **In flight** - a request that has been sent and not answered yet.
> - **Abort** - tell the browser to stop waiting for a request.
> - **Optimistic update** - showing a change before the server confirms it.
> - **Roll back** - put the old value back when the server says no.
> - **Source of truth** - the one place a value really lives.

## Traps 1 to 3: hidden verbs

[Part 2](#/docs/dissecting-problems-four-types) gave each kind of task its own table shape.
This part is about the ways a statement hides rows from you, then practice.

> [!TLDR]
> Verbs hide inside nouns, "and" hides a second output, and rules hide in the Notes.
> Check for all six traps before you code.

> [!ANALOGY]
> A statement is like a rental contract.
> The big print says "two-bedroom flat"; the small print at the bottom says "no pets, no subletting, deposit by Friday".
> The small print is what gets you evicted.

**Trap 1: a noun that is really two verbs.**
"Add pagination" looks like one row.
It is two rows, plus a piece of state.

```text title="notes.md - pagination, unpacked" open
pagination -> really means:
  slice  -> the full row list      -> the rows for this page
  track  -> Prev and Next clicks   -> a page number, held in state
```

Table: each row is a noun that sounds like one job, and the jobs it really hides.

| Noun       | What it hides                   |
| ---------- | ------------------------------- |
| search     | filter, plus a debounce         |
| sorting    | compare, plus track a direction |
| validation | check, plus surface the errors  |
| caching    | store, plus invalidate          |

**Trap 2: "and" hiding a second output.**
"Fetch the users and show a loading state" is two outputs: a list, and a screen state while there is no list.

```text title="notes.md - one sentence, two rows" open
fetch -> a URL               -> a list of users
show  -> nothing loaded yet  -> the word Loading on screen
```

The test: can one half be true while the other is false?
If yes, two rows.

**Trap 3: constraints buried in a Notes section.**
The rules that fail you are rarely in the first paragraph.
In one frontend take-home they sat at the bottom: submit an EDITABLE sandbox link, add no new dependencies, keep every `data-testid`, and put your email in `email.txt`.
None of those is a step.
All of them are pass or fail.

> [!RECAP]
>
> - Nouns ending in -ing or -tion usually hide two verbs.
> - Every "and" gets the test: can the halves be true separately?
> - Always re-read the last paragraph; that is where pass-or-fail rules live.

## Traps 4 to 6: contradictions, double meanings, empty verbs

> [!TLDR]
> Examples sometimes contradict the prose, some words mean two things, and some verbs make nothing.
> Write down which reading you chose, every time.

**Trap 4: an example that contradicts the pattern.**
A puzzle brief writes a rule as `*33*`, which means contains.
Its comment says "ends with 33", and its example id is `ndd6l335`, which contains 33 without ending in it.
Follow the example: it is the acceptance criteria.

> [!GOTCHA]
> Examples outrank prose, and tests outrank examples.
> If a sentence, its example and its test disagree, the test is the truth, the example is the intent, and the sentence is the one someone forgot to update.

**Trap 5: a word that means two different things.**

Table: each row is an everyday word with two meanings, both common in frontend tasks.

| Word   | Meaning one                             | Meaning two                              |
| ------ | --------------------------------------- | ---------------------------------------- |
| body   | what you send with a POST request       | the text that comes back in the response |
| state  | a React value that triggers a re-render | whatever the server currently holds      |
| key    | React's identity hint on a list item    | a property name, or a cache key string   |
| value  | a real property on a form input         | a plain HTML attribute on any tag        |
| cancel | stop a timer that has not fired         | abort a request already in flight        |
| load   | fetch data from somewhere               | show the spinner while that happens      |

When a word has two meanings, write which one you chose next to the row.
That note becomes your clarifying question if you were wrong.

**Trap 6: a verb that produces nothing.**
"Runs only once", "must be accessible", "no libraries", "keep it under 200 lines".
These read like work but make nothing.
Put them on the rules list, where you re-read them before submitting.

> [!STEPS]
>
> 1. **Scan your nouns.** Any noun ending in -ing or -tion is probably two verbs.
> 2. **Scan every "and".** Ask if the two halves can be true separately.
> 3. **Read the last paragraph again.** That is where submission rules hide.
> 4. **Compare each rule to its example.** Where they disagree, follow the example.
> 5. **Circle any word with two meanings.** Write down which one you picked.

> [!NUANCE]-
>
> - Passive voice is the most common hiding place: "are collected in document order" is you, collecting, in order.
> - A number in the text is always a row or a constraint: "half a second", "5 per page", "300ms".
> - "Independent" in a bug list is a claim, not a fact. One take-home's own README admitted a bug depended on three others.
> - The word "simply" usually sits in front of the hardest requirement in the paragraph.
> - A table with one row means you have not dissected anything. Re-read for the second verb.

> [!INTERVIEW]-
>
> - _What questions do you have?_ Name a word with two meanings and say which you assumed.
> - _You missed a requirement._ Point at your rules list: it shows you read the Notes, not just the task.
> - _The example looks wrong._ Say examples outrank prose, then ask which one the tests encode.
> - Spotting a contradiction out loud signals seniority. Silently picking one does not.

> [!RECAP]
>
> - Test beats example, example beats prose.
> - Write down which meaning you picked for every double-meaning word.
> - Verbs that make nothing go on the rules list.

## Drills 1 to 6

> [!TLDR]
> Read the statement in the THINK box, set a three-minute timer, and build your table on paper.
> Only then open the answer, and compare row counts first, wording second.

**Drill 1, a function.**

> [!THINK]
> "Build an autocomplete input. As the user types, wait 300ms after the last keystroke, then request suggestions. Cancel any request still in flight before starting a new one. Show the suggestions under the input, and clear them when the field is emptied."

```text title="drill-1-answer.txt"
verb    -> input                  -> output
--------------------------------------------------------
wait    -> each keystroke         -> a timer, reset every time
request -> the settled query text -> a list of suggestions
cancel  -> a new request starting -> the old request, aborted
show    -> that list              -> a dropdown under the input
clear   -> an empty field         -> no dropdown at all

Rules: only one request live at a time. An empty field shows nothing, not the last results.
The row people drop: clear. It is a separate branch, not a side effect of typing.
```

**Drill 2, a function.**

> [!THINK]
> "Write promisePool(tasks, limit). Each task is a function returning a promise. Run at most limit tasks at once. As each finishes, start the next. Resolve with the results in the original order once every task has settled."

```text title="drill-2-answer.txt"
verb     -> input                    -> output
-------------------------------------------------------------
run      -> the first `limit` tasks  -> that many promises, live
start    -> one slot freeing up      -> the next task, started
collect  -> a finished task + index  -> its result, in the right slot
resolve  -> every task settled       -> one array, input order

Words: limit = how many may run at once. Settled = finished, either way.
The row people drop: collect. Pushing results as they finish gives finish order and fails the test.
```

**Drill 3, a function.**

> [!THINK]
> "Implement an event emitter with on(event, handler), off(event, handler), and emit(event, ...args). Handlers for one event fire in the order they were added. on returns an unsubscribe function. A handler added during an emit must not run in that same emit."

```text title="drill-3-answer.txt"
verb   -> input                     -> output
--------------------------------------------------------------
on     -> an event name + handler   -> a function that removes it
off    -> the same name + handler   -> that one handler, removed
emit   -> a name and some args      -> every handler called, in order
freeze -> the handler list, at emit -> a copy, so late adds are skipped

The row people drop: freeze. It is written as a "must not", and it is the one line of real design here.
```

**Drill 4, a function.**

> [!THINK]
> "Write get(object, path, defaultValue). The path is a string like 'a.b[0].c'. Return the value at that path, or defaultValue when any step along the way is missing. Return defaultValue when the found value is undefined, but not when it is null."

```text title="drill-4-answer.txt"
verb    -> input                     -> output
-----------------------------------------------------------
parse   -> the path string           -> a list of keys: a, b, 0, c
walk    -> object + one key at time  -> the value one level deeper
stop    -> a missing level           -> the default value
decide  -> the final value           -> default only if undefined

Rule: null is a real value and must be returned. Only undefined falls back.
The row people drop: decide. The null-versus-undefined sentence is the whole edge case.
```

**Drill 5, a UI.**

> [!THINK]
> "Render a list of 50,000 rows without freezing. Only the rows in view, plus a small buffer, should be in the DOM. Keep the scrollbar the size it would be if every row were rendered. Row height is fixed at 32px."

```text title="drill-5-answer.txt"
user action  -> state it changes  -> what re-renders
-----------------------------------------------------------------
scroll       -> scrollTop         -> a different slice of rows
resize       -> container height  -> how many rows fit
(no action)  -> nothing           -> first index = scrollTop / 32
(no action)  -> nothing           -> spacer height = 50000 * 32

Words: buffer = a few extra rows so fast scrolling does not flash blank. Spacer = an empty element that sizes the scrollbar.
The row people drop: the spacer. Without it the page scrolls one screen and stops.
```

**Drill 6, a UI.**

> [!THINK]
> "Load 20 items at a time. When the user reaches the bottom of the list, request the next page using the cursor the server returned. Show a spinner at the bottom while loading. Stop requesting when the server returns a null cursor."

```text title="drill-6-answer.txt"
user action  -> state it changes          -> what re-renders
-------------------------------------------------------------------
reach bottom -> loading = true            -> a spinner under the list
response     -> items = old + new, cursor -> twenty more rows
null cursor  -> hasMore = false           -> no spinner, no more requests
(no action)  -> nothing                   -> whether to watch the bottom

Words: cursor = the server's bookmark for "where I stopped". Append = add to the end, keeping what you had.
The row people drop: the append. Replacing instead of appending is a classic take-home bug.
```

> [!RECAP]
>
> - Compare row counts first; the same count means you found every verb.
> - Check the output column only; wording can differ, the thing produced cannot.
> - Note the row you dropped: that is your personal blind spot.

## Drills 7 to 12

> [!TLDR]
> Six more: two UIs, two bugs and two pipelines.
> Same routine: THINK, timer, table, then peek.

**Drill 7, a UI.**

> [!THINK]
> "Add a like button. On click, the count updates immediately and the heart fills. Send the request in the background. If it fails, put the old count back and show a toast. Double clicks must not send two requests."

```text title="drill-7-answer.txt"
user action -> state it changes      -> what re-renders
------------------------------------------------------------------
click       -> liked, count + 1      -> filled heart, new number
click       -> inFlight = true       -> the button, now inert
success     -> inFlight = false      -> nothing visible changes
failure     -> liked and count back  -> old number, plus a toast

Rule: one request per click. The rolled-back value is the one from before THIS click.
The row people drop: keeping the old count somewhere. You cannot roll back to a number you overwrote.
```

**Drill 8, a UI.**

> [!THINK]
> "Render a month view. Show the weeks of the chosen month in a seven-column grid, with blank cells before the first day. Arrows move to the previous or next month and wrap across the year. Today is highlighted."

```text title="drill-8-answer.txt"
user action -> state it changes  -> what re-renders
-------------------------------------------------------------------
click arrow -> the viewed month  -> a whole new grid
(no action) -> nothing           -> days in month, from the date API
(no action) -> nothing           -> weekday of the 1st = blank count
(no action) -> nothing           -> today, compared to each cell

Words: offset = blank cells before the 1st. Wrap = December's next is January of the next year.
The row people drop: the offset. Without it every month starts on Sunday.
```

**Drill 9, a function inside a UI.**

> [!THINK]
> "Add an Export CSV button above the table. It exports the rows currently visible after filters and sorting, not the whole dataset. Amounts keep two decimals, and any field containing a comma is quoted. The file downloads as invoices-YYYY-MM-DD.csv."

```text title="drill-9-answer.txt"
verb     -> input                      -> output
--------------------------------------------------------------
take     -> the filtered, sorted rows  -> the exact rows to export
format   -> each amount                -> a string with two decimals
escape   -> a field holding a comma    -> that field, in quotes
join     -> every formatted row        -> one CSV text blob
download -> that blob + today's date   -> a saved file, named by date

Rule: visible rows only, so the export reads the same derived list the table renders.
The row people drop: escape. One clause in a long sentence, and the only correctness bug here.
```

**Drill 10, a bug.**

> [!THINK]
> "The status filter is sticky. Set Status to Overdue, open an invoice, click back, and the table shows every invoice again, but the Status chip still says Overdue. Refreshing the page fixes it. Expected: the filter and the rows always agree."

```text title="drill-10-answer.txt"
repro step       -> code path               -> owning line / suspect
------------------------------------------------------------------------
set Status       -> setFilter + URL param   -> two writes, one truth needed
open an invoice  -> route change            -> the table unmounts
click back       -> route restores          -> chip reads local state
rows render      -> list read from URL      -> URL param was not restored
refresh works    -> both read the URL       -> proves the URL is correct

Expected and actual first disagree at "click back": look at restoring, not filtering.
The clue people skip: "refreshing fixes it" means the stored value is right and the in-memory copy is wrong. Delete one of the two sources of truth.
```

**Drill 11, a bug.**

> [!THINK]
> "Approving from the detail drawer updates the drawer, but the row behind it still shows Pending until you reload. Approving from the row itself works. Expected: both update together."

```text title="drill-11-answer.txt"
repro step        -> code path            -> owning line / suspect
-----------------------------------------------------------------------
approve in drawer -> drawer's own state   -> local state, drawer only
row stays Pending -> list data unchanged  -> nothing told the list
row path works    -> list state updated   -> proves the list can update
reload fixes it   -> fresh fetch          -> the server was always right

The working path is your strongest evidence: the difference between the two paths IS the bug.
Fix shape: one owner for the value, plus a refetch or invalidate after the write.
```

**Drill 12, a pipeline.**

> [!THINK]
> "Clicking Connect sends the user to the provider with a client id and a random state value. The provider redirects back with a code and that same state. Exchange the code for a token on your server, store it, and return the user to the page they started on. Reject the callback if the state does not match."

```text title="drill-12-answer.txt"
stop verb     -> input                   -> output (the handoff)
--------------------------------------------------------------------
1    generate -> nothing                 -> a random string, saved
2    send     -> client id + that string -> the user, now on the provider
3    receive  -> the redirect back       -> a code and a returned string
4    compare  -> saved vs returned       -> a pass, or a rejected callback
5    exchange -> the code, server side   -> a token
6    store    -> that token              -> a session that can call the API
7    return   -> the saved origin page   -> the user, back where they began

Rules: the exchange happens on the server, never in the browser. A mismatched state is rejected, not retried.
The rows people drop: stop 1, and saving the origin page. Both are set up long before the stop that uses them.
```

> [!NUANCE]-
>
> - Your dropped rows will cluster: most people drop cleanup, rollback and empty-state rows. Learn which one is yours.
> - Drills 1, 6 and 7 all hide an "only one at a time" rule, which always becomes a flag or a saved handle.
> - Drills 10 and 11 are the same bug in different clothes: two copies of one value.
> - If a drill takes more than five minutes you are designing, not dissecting. Stop at the table.
> - Do three drills in a sitting, not twelve. Twelve in a row is how the habit dies.

> [!INTERVIEW]-
>
> - Autocomplete, infinite scroll and optimistic updates are among the most common UI round questions. Expect one of them.
> - _How do you avoid a race here?_ One live request, aborted on the next keystroke.
> - _What happens on failure?_ If your table has no failure row, you have no answer. Add it before they ask.
> - _How would you test this?_ Read the output column: each output is an assertion.

> [!RECAP]
>
> - Re-dissect the same statement tomorrow on a blank page: learn the pattern, not the answer.
> - Failure, rollback and cleanup rows are the ones most often missing.
> - Each output in your table is a test you can write.

## Summary

> [!SUMMARY]
>
> - Nouns like pagination, search and caching each hide two verbs.
> - "And" often hides a second output; test whether the halves can be true separately.
> - Pass-or-fail rules hide in the Notes; re-read the last paragraph.
> - Tests beat examples, examples beat prose, and double-meaning words get a written choice.
> - Drill three statements at a time, compare row counts, and track the row you drop.

This is the last part; go back to [Part 1](#/docs/dissecting-problems-the-method) for the seven-step method in one page.

```quiz
[
  {
    "q": "One of these sentences hides two verbs inside a single noun. Which one?",
    "options": ["Add pagination to the transactions table", "Render the flag as a list of items", "Fetch the hidden URL when the app mounts", "Show Loading while the request is pending"],
    "answer": 0,
    "expl": "Pagination is two actions plus state: slice the rows, and track the page number across clicks. The others each name one action producing one visible thing."
  },
  {
    "q": "\"Fetch the users and show a spinner while it loads.\" A candidate writes one row: fetch, a URL, a list of users. Which output is missing?",
    "options": ["the spinner shown while no list exists yet", "the request itself, once it has been sent", "the list of users, returned by the server", "the error message shown if the call fails"],
    "answer": 0,
    "expl": "The \"and\" joined two things that can be true separately: there is a moment with a spinner and no list. The list of users is already in the candidate's row, so it cannot be the missing one."
  },
  {
    "q": "Select all of the statements below that hide a second, separate output.",
    "options": ["Save the draft and close the dialog afterwards", "Sort the rows by the amount column descending", "Update the count and roll it back on failure", "Join the characters into one long string value"],
    "answer": [0, 2],
    "multi": true,
    "expl": "Each of those two can be half-true: saved but still open, or updated but never rolled back. Sorting and joining each produce exactly one thing."
  },
  {
    "q": "A spec sentence, its example and its test all disagree about one rule. Which should your code follow?",
    "options": ["The sentence, since it states the rule directly", "The example, since it shows the intended data", "The test, since it is what grades you", "Whichever is simplest, then note the conflict"],
    "answer": 2,
    "expl": "Tests beat examples and examples beat prose: the test is what decides pass or fail. The example is the intent, which is why it wins over the sentence when there is no test."
  },
  {
    "q": "In the sticky-filter bug, refreshing the page fixes it. What does that clue tell you most directly?",
    "options": ["The filter logic itself is broken", "The stored value is right, the in-memory copy wrong", "The server returns the wrong rows after navigation", "The table forgot to re-render after the route change"],
    "answer": 1,
    "expl": "A refresh rebuilds everything from the stored value, so if it fixes things, that value was right. The in-memory copy drifted, which means two sources of truth; broken filter logic would fail after a refresh too."
  },
  {
    "q": "Your like-button table has click, success and failure rows. Which pieces does a correct rollback need? Select all that apply.",
    "options": ["The count as it was before this click", "A flag that blocks a second request mid-flight", "A spinner that replaces the heart icon", "A refetch of the whole list after each click"],
    "answer": [0, 1],
    "multi": true,
    "expl": "You can only restore a value you kept, and a second in-flight request would roll back to the wrong number. A spinner defeats the point of an optimistic update, and a full refetch per click is unneeded."
  },
  {
    "q": "A drill takes you eight minutes and you have started sketching components. What should you do?",
    "options": ["Stop at the table; you are designing now", "Keep going, since the design time pays off", "Start over and aim to finish in three", "Skip the remaining drills for this sitting"],
    "answer": 0,
    "expl": "Dissection ends at the table, rules list and three sentences; sketching components is design. Pushing on feels productive, but it trains the wrong habit for a timed round."
  }
]
```

```related
[
  {
    "title": "AbortController",
    "url": "https://developer.mozilla.org/en-US/docs/Web/API/AbortController",
    "source": "MDN",
    "kind": "read",
    "note": "How the cancel row in the autocomplete drill works."
  },
  {
    "title": "Event Emitter",
    "url": "https://www.greatfrontend.com/questions/javascript/event-emitter",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Medium",
    "note": "Drill 3, as a real question: dissect it, then build it."
  },
  {
    "title": "get",
    "url": "https://www.greatfrontend.com/questions/javascript/get",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Medium",
    "note": "Drill 4: the null-versus-undefined edge case."
  },
  {
    "title": "Like Button",
    "url": "https://www.greatfrontend.com/questions/user-interface/like-button",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Medium",
    "note": "Drill 7: optimistic update with a failure path."
  }
]
```
