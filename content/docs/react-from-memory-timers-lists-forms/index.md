---
title: React from memory - timers, lists and forms
summary: The last React shapes to type cold - a timer in an effect, rendering a list, inputs and forms - plus the explain tier and a 10 minute daily drill.
date: 2026-09-17
part: 2
series: React From Memory
tags: [react, hooks, interviews]
minutes: 13
---

> [!TERMS]
>
> - **Stale closure** - a callback that keeps seeing old variable values from the render it was created in.
> - **Functional updater** - passing the setter a function, `setShown(n => n + 1)`, so React hands it the live value.
> - **Early return** - returning JSX before the main return, for example while data is loading.
> - **Key** - the `key` prop on list items that tells React which item is which between renders.
> - **Derived data** - a value worked out from state during render instead of being stored as more state.
> - **Controlled input** - an input whose text lives in React state: `value` shows it, `onChange` writes it.
> - **Ref** - a box from `useRef` that survives renders and never causes one.
> - **Memoise** - cache a value or function so it is reused until its inputs change.

## Shape 4: a timer inside an effect

> [!TLDR]
> Guard, start the interval, update with the arrow form, and clear it in cleanup.
> Never read the state variable inside the timer callback.

[Part 1](#/docs/react-from-memory-state-and-effects) built state, the effect skeleton and fetch.
This part uses one running example: a small component that fetches a secret word and reveals it one letter every half second.

Here is the trap.
You write `setShown(shown + 1)` inside `setInterval`.
One letter appears, and then the list freezes.
No error, and the interval is still firing.

> [!ANALOGY]
> The interval callback carries a photo of the variables from the moment it was made.
> If it reads `shown`, it reads the photo, which says `0` forever.
> `setShown(n => n + 1)` skips the photo; React hands it the live value as `n`.

> [!THINK]
> What should happen if the word has not arrived yet?
> Where do you keep the interval id so cleanup can stop it?
> Which value belongs in the dependency list: `word`, `shown`, or both?

```tsx title="reveal-timer.tsx"
useEffect(() => {
  if (word === null) return; // guard: nothing to reveal yet
  const id = setInterval(() => {
    setShown((n) => {
      // arrow form: newest n
      if (n + 1 >= word.length) clearInterval(id);

      return Math.min(n + 1, word.length); // never go past the end
    });
  }, 500);

  return () => clearInterval(id); // cleanup
}, [word]); // restart only when the word arrives
```

> [!STEPS]
>
> 1. **Guard first.** If the data is not here, return before starting anything.
> 2. **Keep the id.** `const id = setInterval(...)`; you need it to stop the timer.
> 3. **Update with the arrow form.** Never read the state variable inside the callback.
> 4. **Clamp the value.** `Math.min` means one late tick cannot overshoot.
> 5. **Clear in cleanup.** `return () => clearInterval(id)`.
> 6. **List only what restarts the timer.** `[word]`, never `shown`.

> [!NUANCE]-
>
> - Put `shown` in the list and it still looks right, but the timer is torn down and rebuilt on every tick.
> - Calling `clearInterval` inside the updater is a small side effect in a function React expects to be pure; StrictMode may call an updater twice, and it is safe here only because clearing twice does nothing.
> - The purist version: `setTimeout` in an effect with `[word, shown]`, guarded by `shown >= word.length`. One tick per effect run. Mention it; do not switch mid-interview.
> - The bare `return;` in the guard returns nothing, which is a valid "no cleanup needed".

> [!INTERVIEW]-
>
> - *"Why is `shown` not in the dependency list?"* The effect never reads it; the arrow form gets it from React.
> - *"My counter is stuck at 1. Why?"* Stale closure: the callback captured the first value.
> - *"Why two effects and not one?"* Two triggers: one runs on mount, one runs when the word arrives.
> - *"setInterval or chained setTimeout?"* Interval is fewer lines; timeouts never overlap and are easier to stop. Either is fine if cleaned up.

> [!RECAP]
>
> - Guard, keep the id, arrow form, clamp, clear in cleanup.
> - Reading state inside a timer gives a stale closure.
> - Twice as fast in dev means you forgot the cleanup.

## Shape 5 and 6: what you return, and forms

> [!TLDR]
> Return early for loading, then map an array to elements with a key.
> An input shows state and writes state, and a handler is a function you pass, never one you call.

> [!THINK]
> After the loading branch, how do you get the visible letters without a third piece of state?
> For a form: where does `onSubmit` go, and what is the first thing it must do?
> How do you pass `u.id` to a click handler without calling it during render?

```tsx title="reveal-render.tsx" group="render" tab="Render a list"
if (word === null) return <p>Loading...</p>;

return (
  <ul>
    {word
      .slice(0, shown)
      .split("")
      .map((c, i) => (
        <li key={i}>{c}</li>
      ))}
  </ul>
);
```

```tsx title="add-user-form.tsx" group="render" tab="Input and form"
const [q, setQ] = useState("");

<form
  onSubmit={(e) => {
    e.preventDefault();
    addUser(q);
    setQ("");
  }}
>
  <input value={q} onChange={(e) => setQ(e.target.value)} />
  <button type="submit">Add</button>
</form>;

<button onClick={() => removeUser(u.id)}>Remove</button>; // pass a function
```

Table: each row is one step, for rendering on the left and for forms on the right.

| Rendering                                                        | Forms                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| Put every hook above the early return                             | One state per input, starting at `''`                               |
| Return the loading branch first; TypeScript then knows the type  | Wire both directions: `value={q}` shows it, `onChange` writes it    |
| Calculate what is visible: `word.slice(0, shown)`                | `e.target.value` is always a string, even for a number input        |
| Map inside braces: `{items.map(x => <li key={x.id}>...</li>)}`   | Submit on the form, not the button; it also catches Enter           |
| Give each item a stable key, a real id when you have one        | Call `e.preventDefault()` first, or the page reloads                |

> [!GOTCHA]
> `onClick={remove(id)}` calls `remove` during render, for every row, on page load.
> Everything vanishes before anyone clicks.
> Wrap it: `onClick={() => remove(id)}`.

> [!NUANCE]-
>
> - `key={i}` is fine here only because the list grows at the end and never reorders; with delete, insert or sort, index keys make React reuse the wrong row.
> - `{items.length && <List />}` prints a stray `0` when the list is empty. Write `items.length > 0 &&`.
> - An early return placed above a hook throws "Rendered more hooks than during the previous render" once the condition flips.
> - JSX takes expressions, not statements: no `if` inside braces; use a ternary, `&&`, or an early return.
> - `value` with no `onChange` gives a frozen input and a console warning.
> - Written inline, TypeScript infers the event type; pulled out, you need `React.ChangeEvent<HTMLInputElement>` or `React.FormEvent`. That is Look up tier.
> - Several fields? One object in state and `setForm(f => ({ ...f, [name]: value }))`.
> - Filtering a list by `q` is derived data: `users.filter(...)` in the render body, not a second state.
> - In an interview sandbox, plain `<ul>` and `<button>` are expected, even if your own codebase wraps them.

> [!INTERVIEW]-
>
> - *"What is a key for?"* It tells React which item is which between renders, so state and DOM stay with the right row.
> - *"When is an index key acceptable?"* Static or append-only lists with no per-row state.
> - *"Why slice instead of a letters array in state?"* One source of truth; two copies can disagree.
> - *"Controlled versus uncontrolled?"* Controlled: React state owns the text. Uncontrolled: the DOM owns it and you read it with a ref.
> - *"Why onSubmit and not onClick?"* Enter key, and one place for validation.

> [!RECAP]
>
> - Hooks first, then the loading return, then map with a stable key.
> - Inputs need both `value` and `onChange`; submit on the form with `preventDefault`.
> - Pass a function to `onClick`, never the result of calling one.

## Optional: the explain tier - useRef, useMemo, useCallback

> [!TLDR]
> You rarely need to type these cold.
> You need one sentence for each, and one case where it is the wrong tool.

> [!ANALOGY]
> A ref is a sticky note on the back of the screen: it stays, but writing on it changes nothing anyone sees.
> useMemo is a saved answer to a slow sum; useCallback is keeping the same phone number so nobody has to update their contacts.

```tsx title="explain-tier.tsx"
const inputRef = useRef<HTMLInputElement>(null); // a box that survives renders
const timerId = useRef<number | null>(null); // changing it draws nothing
const visible = useMemo(
  // cache a calculation
  () => rows.filter((r) => r.name.includes(q)),
  [rows, q],
);
const onPick = useCallback(
  // cache a function
  (id: string) => setSelected(id),
  [],
);
```

Table: each row is one hook, its one-sentence meaning, and when it is the wrong tool.

| Hook          | One sentence                                                   | Wrong tool when                                                     |
| ------------- | -------------------------------------------------------------- | ------------------------------------------------------------------- |
| `useRef`      | a mutable box that persists across renders and never causes one | the screen should change when the value changes; that is state     |
| `useMemo`     | keeps a calculated value until its inputs change               | the calculation is cheap; the cache costs more than it saves        |
| `useCallback` | keeps the same function object until its inputs change         | nothing compares that function: no memoised child, no dependency list |
| custom hook   | a function named `useX` that calls other hooks, to share logic | it calls no hooks; then it is just a function                       |

> [!STEPS]
>
> 1. **Default to none of them.** Write it plain first; working beats optimised.
> 2. **Reach for useRef when a value must survive but not draw.** A timer id for a Stop button, a DOM node to focus.
> 3. **Reach for useMemo when you can name the slow thing.** Filtering 10,000 rows on each keystroke.
> 4. **Reach for useCallback only with a reason you can say.** "This goes to a memoised child" or "this is in a dependency list".
> 5. **Extract a custom hook when two components share effect logic.** `useFetch(url)` is the classic follow-up.

> [!NUANCE]-
>
> - Read and write a ref through `.current`; forgetting `.current` is the usual slip.
> - Do not read or write a ref during render for anything that affects output; use it in handlers and effects.
> - React Compiler memoises for you, but an interview sandbox usually does not, and interviewers still ask the manual version.
> - Test for ref versus state: should the screen change when it changes? No means ref.

> [!INTERVIEW]-
>
> - *"useRef versus useState?"* Both persist; only state triggers a render.
> - *"useMemo versus useCallback?"* Memo caches a result; callback caches the function itself.
> - *"Should every handler be wrapped in useCallback?"* No. It only matters when something compares function identity.
> - *"Turn your fetch effect into a hook."* Move the state and the effect into `useFetch(url)`, put `url` in the list, return `{ data, error }`.

> [!RECAP]
>
> - Ref survives without drawing; memo caches a value; callback caches a function.
> - Use none by default; add one only when you can name the reason.

## The 10 minute daily drill

> [!TLDR]
> Blank file, 10 minute timer, type the whole reveal component from memory, diff it, write down the misses.
> Five days of this beats five hours of reading.

> [!ANALOGY]
> This is a flashcard deck with one card.
> The number of misses is your score, and watching it drop is the reward.

The whole component is seven spoken lines.
If you can say them, you can type them.

Table: each row is one line you say out loud, then the code it becomes.

| #   | Say                                                             | Then type                                  |
| --- | --------------------------------------------------------------- | ------------------------------------------ |
| 1   | "Two states: the word, and how many letters show."             | two `useState` lines                       |
| 2   | "Effect one: on mount, fetch with a canceller."                 | skeleton with `[]`                         |
| 3   | "Text, trim, store. Ignore abort errors."                       | two `.then`, one `.catch`                  |
| 4   | "Cleanup aborts."                                               | `return () => ac.abort()`                  |
| 5   | "Effect two: when the word arrives, start a 500 ms interval."   | guard, `setInterval`, `[word]`             |
| 6   | "Each tick adds one with the arrow form, and stops at the end." | `setShown(n => ...)`, `clearInterval`      |
| 7   | "Render: loading, or a list of the slice."                      | early return, slice, map, key              |

> [!THINK]
> Say the seven lines out loud now.
> Then type the component in a blank file before you open the answer.

```tsx title="Reveal.tsx"
import { useEffect, useState } from "react";

const WORD_URL = "/api/word";

export const Reveal = () => {
  const [word, setWord] = useState<string | null>(null);
  const [shown, setShown] = useState(0);

  useEffect(() => {
    const ac = new AbortController();
    fetch(WORD_URL, { signal: ac.signal })
      .then((r) => r.text())
      .then((t) => setWord(t.trim()))
      .catch((e) => {
        if (e.name !== "AbortError") console.error(e);
      });

    return () => ac.abort();
  }, []);

  useEffect(() => {
    if (word === null) return;
    const id = setInterval(() => {
      setShown((n) => {
        if (n + 1 >= word.length) clearInterval(id);

        return Math.min(n + 1, word.length);
      });
    }, 500);

    return () => clearInterval(id);
  }, [word]);

  if (word === null) return <p>Loading...</p>;

  return (
    <ul>
      {word
        .slice(0, shown)
        .split("")
        .map((c, i) => (
          <li key={i}>{c}</li>
        ))}
    </ul>
  );
};
```

> [!STEPS]
>
> 1. **Open a blank `App.tsx` with AI autocomplete off.** Autocomplete hides exactly the gaps you are trying to find.
> 2. **Start a 10 minute timer.** A hard stop keeps it small enough to start.
> 3. **Say the seven lines, then type.** No peeking; leave a `// ???` where you blank and keep going.
> 4. **Diff against the answer.** Count the misses and write the number down.
> 5. **Retype only the lines you missed, three times each.** That is the whole correction.
> 6. **Stop.** Tomorrow, same thing. Watch the number fall.

Table: each row is one day of the plan, and how you know that day is done.

| Day | Drill                                                                   | Done when                                    |
| --- | ----------------------------------------------------------------------- | -------------------------------------------- |
| 1   | Reveal component, with this doc open beside you                         | it runs                                      |
| 2   | Reveal component, doc closed                                            | three misses or fewer                        |
| 3   | Same, then add an error state and the `r.ok` check                      | zero misses on the core                      |
| 4   | Users list: add with a form, remove with a button, filter with an input | no mutation, no `onClick={fn(id)}`           |
| 5   | Both, out loud, as if pairing                                           | you explain every line without stopping      |

The target is the full component typed cold in under 6 minutes, with a one-line reason for every line.
It is a goal to aim for, not a measured result.

> [!NUANCE]-
>
> - Rereading feels productive and builds recognition only; typing is the part you are missing.
> - Same time every day, tied to something you already do, such as the first coffee; remove the decision.
> - Going from 9 misses to 2 in four days is the reward that keeps the habit going.
> - Do not extend a good session. Ten minutes, stop. A drill you dread is a drill you skip.

> [!INTERVIEW]-
>
> - *"Walk me through your component."* Use the seven spoken lines; they are already in build order.
> - *"What would you add with more time?"* An error state with an `r.ok` check, then a `useFetch` hook.
> - *"Where could this break?"* No cleanup under StrictMode, a stale closure in the timer, index keys if the list ever reorders.

Table: the cheat-sheet - each row is one shape, the line to type, and its one rule.

| Shape             | The line to type                                        | One-line rule                                              |
| ----------------- | ------------------------------------------------------- | ---------------------------------------------------------- |
| State             | `const [x, setX] = useState(0)`                         | Type it only for `null` and `[]`                           |
| Updater           | `setX(n => n + 1)`                                      | Arrow form whenever new depends on old, always in timers   |
| Array change      | `[...a, x]` / `a.filter()` / `a.map()`                  | Never push; copy before sort                               |
| Effect skeleton   | `useEffect(() => { ...; return () => undo; }, [deps])`  | Set up, clean up, when                                     |
| Dependency list   | `[]` once, `[x]` on change, none every render           | No list plus a setter is an endless loop                   |
| Fetch             | `fetch(url, { signal: ac.signal })`                     | Abort in cleanup, ignore `AbortError`, check `r.ok`        |
| Loading           | `if (data === null) return <p>Loading...</p>`           | Derive it; no `finally { setLoading(false) }`              |
| Timer             | `const id = setInterval(fn, 500)`                       | `clearInterval(id)` in cleanup                             |
| List              | `{items.map(x => <li key={x.id}>...</li>)}`             | Index keys only for append-only lists                      |
| Conditional       | `{n > 0 && <List />}`                                   | Never a bare number on the left of `&&`                    |
| Hook order        | all hooks, then early returns                           | A return above a hook crashes when the condition flips     |
| Input             | `value={q} onChange={e => setQ(e.target.value)}`        | Both directions, or the input freezes                      |
| Form              | `onSubmit={e => { e.preventDefault(); ... }}`           | On the form, not the button                                |
| Handler           | `onClick={() => remove(id)}`                            | Pass a function; `remove(id)` bare runs during render      |

> [!RECAP]
>
> - Say the seven lines, type cold for 10 minutes, count the misses.
> - Retype only what you missed, and stop at 10 minutes.
> - The cheat-sheet is the whole Type cold tier on one screen.

## Summary

> [!SUMMARY]
>
> - A timer effect: guard, keep the id, arrow-form updater, clamp, clear in cleanup.
> - Render: hooks first, loading return, derived slice, map with a stable key.
> - Forms: controlled inputs, `onSubmit` with `preventDefault`, pass handlers as functions.
> - useRef, useMemo and useCallback are Explain tier: one sentence each, and when not to use them.
> - A 10 minute daily drill with a miss count turns recognition into recall.

```quiz
[
  {
    "q": "Inside a setInterval callback you write setShown(shown + 1), and the effect lists only [word]. The screen shows one letter and then stops growing. Why?",
    "options": ["The callback captured shown as zero and keeps setting one", "The interval was cleared by cleanup after its first tick", "The setter ignores calls that come from inside a timer", "The word changed again, so the effect restarted the count"],
    "answer": 0,
    "expl": "The callback was created once and holds the shown value from that render, which is 0. Every tick sets 0 + 1. The interval is still firing, which is why it is not a cleanup problem: setShown(n => n + 1) reads the live value instead."
  },
  {
    "q": "A component has \"if (!user) return <p>Sign in</p>\" placed above a useEffect. After login React throws \"Rendered more hooks than during the previous render\". What is the fix?",
    "options": ["Wrap the effect in a condition that checks the user", "Add the user to the effect's dependency list to resync", "Move the early return below every hook in the component", "Replace the early return with a ternary inside the effect"],
    "answer": 2,
    "expl": "Hooks must run in the same order on every render. Before login the return skipped the effect, after login it did not, so the hook count changed. Wrapping the hook in a condition is the same mistake in a different place: put the condition inside the effect, not around it."
  },
  {
    "q": "You render {items.length && <List items={items} />}. With an empty array the page shows a stray 0. Why?",
    "options": ["An empty array is truthy, so the list renders blank", "Zero is falsy but React still renders it as text", "The length check runs before the items state has loaded", "The list returns zero when it has no children inside"],
    "answer": 1,
    "expl": "The && expression evaluates to its left side when that side is falsy, so it evaluates to 0. React skips false, null and undefined, but it prints numbers. Write items.length > 0 && so the left side is a real boolean."
  },
  {
    "q": "A todo list uses key={index}, and each row holds an uncontrolled text input. You delete the first row, and its typed text now sits on the next todo. Why?",
    "options": ["The delete handler mutated the array, so rows shifted wrongly", "Uncontrolled inputs always reset their text after a list change", "React re-mounted every row, which shuffled the input values", "Index keys made React reuse row one's DOM for item two"],
    "answer": 3,
    "expl": "After the delete, the second todo now has index 0, so React matches it to the old first row and keeps that DOM node, typed text included. A re-mount would have cleared the text, not moved it. A stable id as the key keeps each node with its item."
  },
  {
    "q": "Each row has <button onClick={remove(user.id)}>. On page load every user disappears before anyone clicks. Why?",
    "options": ["It calls remove during render instead of passing a function", "StrictMode doubles every click event, so the handler runs twice", "The user id is captured stale, so every row matches", "Buttons inside lists need a key before handlers bind"],
    "answer": 0,
    "expl": "Braces hold an expression, and remove(user.id) is a call, so it runs while rendering each row. onClick needs a function: () => remove(user.id). StrictMode does not double click events, and nobody clicked anyway."
  },
  {
    "q": "A Stop button must clear an interval that an effect started. Holding the interval id should never cause a redraw. Which tool fits?",
    "options": ["useState, because the setter always gives the freshest id", "useMemo, because it caches the id until dependencies change", "useRef, because it persists across renders without causing one", "A module variable, because it survives across every instance"],
    "answer": 2,
    "expl": "A ref is a box that survives renders and changing it draws nothing, which is exactly what a timer id needs. State would work but redraws for no reason. A module variable is shared by every instance of the component, so two of them would fight over one id."
  },
  {
    "q": "In a live pairing round you blank on the exact TypeScript type for an input change event. Select every reasonable move.",
    "options": ["Say the shape aloud, then look the exact type up", "Type the handler inline so TypeScript infers the event type", "Go silent for a few minutes until the type comes back", "Mark it loosely with a spoken TODO and keep building"],
    "answer": [0, 1, 3],
    "multi": true,
    "expl": "Exact event types are Look up tier: naming the shape, letting inference do it inline, or parking it out loud all keep the round moving. Going silent is the costly option, because the interviewer grades what they can hear."
  },
  {
    "q": "A teammate wraps every event handler in useCallback \"for performance\". None of the child components are memoised. What do you say?",
    "options": ["Good habit, since stable functions always prevent child re-renders", "Pointless here, since nothing compares those function identities", "Harmful, since useCallback re-creates the function twice per render", "Required, since effects refuse handlers that are not memoised"],
    "answer": 1,
    "expl": "useCallback only pays off when something checks whether the function changed: a memoised child or a dependency list. Without that, children re-render with their parent regardless. It is not harmful in the way described, it is just extra code for no gain."
  }
]
```

```related
[
  {
    "title": "useEffect reference",
    "url": "https://react.dev/reference/react/useEffect",
    "source": "React docs",
    "kind": "read",
    "note": "Includes the interval example and why the updater function avoids a stale value."
  },
  {
    "title": "Rendering lists",
    "url": "https://react.dev/learn/rendering-lists",
    "source": "React docs",
    "kind": "read",
    "note": "map, keys, and why index keys go wrong when a list reorders."
  },
  {
    "title": "input reference",
    "url": "https://react.dev/reference/react-dom/components/input",
    "source": "React docs",
    "kind": "read",
    "note": "Controlled inputs, onChange and the frozen-input warning."
  },
  {
    "title": "useRef reference",
    "url": "https://react.dev/reference/react/useRef",
    "source": "React docs",
    "kind": "read",
    "note": "A box that survives renders; the timer-id and focus cases from the explain tier."
  },
  {
    "title": "Reusing logic with custom hooks",
    "url": "https://react.dev/learn/reusing-logic-with-custom-hooks",
    "source": "React docs",
    "kind": "read",
    "note": "The useFetch follow-up question, done properly."
  }
]
```
