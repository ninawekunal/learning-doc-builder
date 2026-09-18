---
title: React from memory - state, effects and fetch
summary: The first four React shapes to type without looking - useState, the effect skeleton and fetch with a canceller.
date: 2026-09-17
part: 1
series: React From Memory
tags: [react, hooks, interviews]
minutes: 11
---

> [!TERMS]
>
> - **Shape** - a small pattern of code, a few lines long, that you can type without thinking.
> - **Type cold** - write it from memory, with no docs and no autocomplete.
> - **State** - a value React remembers between redraws; changing it through the setter redraws the screen.
> - **Setter** - the function from `useState` that stores a new value, like `setCount`.
> - **Functional updater** - passing the setter a function, `setCount(n => n + 1)`, so it builds the new value from the newest old one.
> - **Effect** - code in `useEffect` that talks to things outside React, like the network or a timer.
> - **Cleanup** - the function an effect returns; it undoes what the effect started.
> - **Dependency list** - the array at the end of `useEffect` that says when the effect should run again.
> - **StrictMode** - a development-only wrapper that mounts each component twice on purpose to expose missing cleanups.
> - **AbortController** - a browser object that can cancel a `fetch` that is still running.

## The big picture

> [!TLDR]
> You do not memorise all of React.
> You drill about eight small shapes until your fingers type them cold, and you explain or look up the rest.

Here is what goes wrong in a live coding round.
You use AI every day, so you recognise React instantly.
Then the editor is blank, autocomplete is off, and `useEffect` will not come out of your fingers.
That is normal.
Recognition comes from reading; recall comes only from typing.

<svg viewBox="0 0 720 170" role="img" aria-label="Three tiers of React knowledge: type cold, explain, look up">
  <rect x="10" y="20" width="220" height="110" rx="12" fill="none" stroke="var(--ok)" stroke-width="2"/>
  <text x="120" y="48" text-anchor="middle" font-size="14" font-weight="800" fill="var(--ok)">TYPE COLD</text>
  <text x="120" y="72" text-anchor="middle" font-size="12" fill="var(--text)">8 shapes, no lookup</text>
  <text x="120" y="92" text-anchor="middle" font-size="12" fill="var(--text-muted)">useState, useEffect,</text>
  <text x="120" y="110" text-anchor="middle" font-size="12" fill="var(--text-muted)">fetch, timer, list, input</text>
  <rect x="250" y="20" width="220" height="110" rx="12" fill="none" stroke="var(--info)" stroke-width="2"/>
  <text x="360" y="48" text-anchor="middle" font-size="14" font-weight="800" fill="var(--info)">EXPLAIN</text>
  <text x="360" y="72" text-anchor="middle" font-size="12" fill="var(--text)">say why, in one line</text>
  <text x="360" y="92" text-anchor="middle" font-size="12" fill="var(--text-muted)">stale closure, StrictMode,</text>
  <text x="360" y="110" text-anchor="middle" font-size="12" fill="var(--text-muted)">keys, useRef, useMemo</text>
  <rect x="490" y="20" width="220" height="110" rx="12" fill="none" stroke="var(--accent)" stroke-width="2"/>
  <text x="600" y="48" text-anchor="middle" font-size="14" font-weight="800" fill="var(--accent)">LOOK UP</text>
  <text x="600" y="72" text-anchor="middle" font-size="12" fill="var(--text)">nobody minds</text>
  <text x="600" y="92" text-anchor="middle" font-size="12" fill="var(--text-muted)">exact event types, fetch</text>
  <text x="600" y="110" text-anchor="middle" font-size="12" fill="var(--text-muted)">options, date and Intl APIs</text>
  <text x="360" y="158" text-anchor="middle" font-size="12" fill="var(--text-muted)">Interviewers grade the left box on speed and the middle box on clarity.</text>
</svg>

> [!ANALOGY]
> Think of a pianist.
> Scales are drilled until the hands play them alone; that is the Type cold tier.
> Why a chord sounds sad is something they can say out loud; that is Explain.
> An obscure piece they read from sheet music; that is Look up.

Table: each row is one tier, what belongs in it, and where this series teaches it.

| Tier      | What is in it                                                                              | Where                    |
| --------- | ------------------------------------------------------------------------------------------ | ------------------------ |
| Type cold | the `useState` line, the functional updater, add / remove / update on an array             | Part 1, useState         |
| Type cold | the `useEffect` skeleton: set up, cleanup, dependency list                                 | Part 1, effect skeleton  |
| Type cold | `fetch` inside an effect with `AbortController`                                            | Part 1, fetch            |
| Type cold | `setInterval` inside an effect, cleared in cleanup                                         | Part 2, timer            |
| Type cold | early return for loading, `.map` with `key`, controlled input, form submit                 | Part 2, render and forms |
| Explain   | stale closure, StrictMode double mount, keys, derived data, `useRef`, `useMemo`, `useCallback` | Both parts           |
| Look up   | `React.ChangeEvent<HTMLInputElement>`, fetch options, anything CSS, anything date          | Part 2, forms            |

> [!STEPS]
>
> 1. **Read one section, then close the doc.** One shape per sitting is enough.
> 2. **Type that shape into a blank file.** Reading builds recognition; only typing builds recall.
> 3. **Diff it against the doc.** Every miss is exactly what to drill tomorrow.
> 4. **Say the one-line why out loud.** The Explain tier is graded on speech, not typing.
> 5. **Finish with the daily drill in Part 2.** It rebuilds a whole small component in 10 minutes.

> [!NUANCE]-
>
> - A take-home lets you look everything up; the pressure is the live pairing round of about 50 minutes.
> - Whether a live round allows docs, search or AI differs by company and by round, so ask the recruiter before the day.
> - Blanking on a rare API costs nothing; blanking on effect cleanup costs minutes, because everything else sits on top of it.
> - The eight shapes are about 40 lines in total. This is a small job.

> [!INTERVIEW]-
>
> - *"Can I look something up?"* Yes, if you first say the shape you expect: "I need the change event type, it is a generic on the element," then look.
> - *"You seem rusty on syntax."* Own it in one line: "I pair with AI daily, so I drill the core shapes by hand. Ask me why any line is there."
> - *"What do they grade?"* A working result, the order you build in, and whether you can explain each line.

> [!RECAP]
>
> - Three tiers: type cold, explain, look up.
> - Only about eight shapes need to be typed cold.
> - Typing builds recall; rereading only builds recognition.

## Shape 1: useState and the updater

> [!TLDR]
> State is a value React remembers between redraws.
> You never change it in place; you hand the setter a new value, or a function that builds one from the old value.

Here is the trap.
You write `users.push(u)` and then `setUsers(users)`.
Nothing happens on screen, and no error appears.
React compares the old and new value by reference, and it is still the same array.

> [!ANALOGY]
> State is a photo on the fridge.
> Drawing on the photo does not tell anyone it changed.
> You print a new photo and swap it in; that swap is what React notices.

> [!THINK]
> How do you write a counter that starts at 0?
> How do you add, remove and update one item in an array without touching the old array?
> Which starting values need a TypeScript type, and which do not?

```tsx title="state-shapes.tsx"
const [count, setCount] = useState(0);
const [flag, setFlag] = useState<string | null>(null);
const [users, setUsers] = useState<User[]>([]);

setCount((n) => n + 1); // from the old value
setUsers((us) => [...us, newUser]); // add
setUsers((us) => us.filter((u) => u.id !== id)); // remove
setUsers((us) => us.map((u) => (u.id === id ? { ...u, name } : u))); // update
```

> [!STEPS]
>
> 1. **Write the pair.** Square brackets, value first, setter second, named `setX`.
> 2. **Give the starting value.** `0`, `''`, `[]`, or `null` for "not loaded yet".
> 3. **Add the type only when TypeScript cannot guess.** `null` and `[]` need it; `0` and `''` do not.
> 4. **Use the arrow form when the new value depends on the old.** `setCount(n => n + 1)`.
> 5. **For arrays, always build a new one.** Spread to add, filter to remove, map to update.

> [!NUANCE]-
>
> - Calling `setCount(count + 1)` three times in one handler adds one, not three: all three read the same `count` from this render.
> - After you call the setter, the variable does not change on the next line; the new value arrives on the next render.
> - `sort` and `reverse` change the array in place, so copy first: `[...us].sort(fn)`.
> - If a value can be worked out from other state, do not store it; work it out while rendering.

> [!INTERVIEW]-
>
> - *"Why the function form of the setter?"* It reads the newest value, not the one captured when this code was created.
> - *"Why not mutate?"* React compares references. Same reference means no redraw.
> - *"Why `null` and not an empty string for a loaded value?"* `null` means still loading; an empty string could be a real answer.

> [!RECAP]
>
> - Never mutate state; give the setter a new value.
> - Use the arrow form when the new value depends on the old.
> - Spread to add, filter to remove, map to update, copy before sort.

## Shape 2: the useEffect skeleton

> [!TLDR]
> An effect has three slots: set something up, return a function that undoes it, and list the values that restart it.
> Learn the three slots and every effect is the same effect.

> [!ANALOGY]
> An effect is borrowing a library book.
> You check it out (set up), you promise to return it (cleanup), and you only borrow again when your reading list changes (dependency list).

> [!THINK]
> Before you peek, name the three slots in order.
> Which slot is a function that the effect returns?
> Where does the list of values go?

```tsx title="effect-skeleton.tsx"
useEffect(() => {
  // 1. SET UP: start a fetch, a timer, a listener
  const id = startSomething();
  // 2. CLEAN UP: undo exactly what step 1 started
  return () => stopSomething(id);
  // 3. WHEN: re-run only if one of these changed
}, [dep]);
```

The third slot decides everything.

Table: each row is one way to end the effect, when it runs, and what it is for.

| You write      | It runs                                           | Use it for                    |
| -------------- | ------------------------------------------------- | ----------------------------- |
| `}, []);`      | once, after the first draw                        | load data on mount            |
| `}, [flag]);`  | after the first draw, then whenever `flag` changes | react to a value arriving    |
| `});` no list  | after every single draw                           | almost never; usually a bug   |

> [!STEPS]
>
> 1. **Type the empty skeleton first.** `useEffect(() => { }, []);` before any logic.
> 2. **Write the set up line.** One thing: a fetch, a timer, or a listener.
> 3. **Write the cleanup straight away.** It mirrors the set up line.
> 4. **Fill the dependency list last.** Every value from the component that the effect reads goes in.
> 5. **Ask whether you need an effect at all.** Effects are for things outside React; pure calculation belongs in the render body.

> [!GOTCHA]
> In development, StrictMode mounts your component, unmounts it, and mounts it again, on purpose.
> An effect with no cleanup now has two fetches, two timers or two listeners alive.
> A typewriter effect runs at double speed.
> If something happens twice in dev and once in production, you are missing a cleanup.

> [!NUANCE]-
>
> - Cleanup runs before the effect re-runs, and once more on unmount; it is not only an unmount hook.
> - The effect callback cannot be `async`: an async function returns a promise, and React expects a cleanup function or nothing.
> - An effect that sets state with no dependency list loops forever: draw, effect, set state, draw, effect.
> - Objects and arrays created during render are new every time, so one in the list makes the effect run every render.
> - All hooks go above any early return, because hooks must run in the same order on every render.

> [!INTERVIEW]-
>
> - *"When does cleanup run?"* Before the next run of the same effect, and on unmount.
> - *"Empty list versus no list?"* Empty runs once; no list runs after every render.
> - *"Why does my effect fire twice in dev?"* StrictMode double mount. The fix is cleanup, never removing StrictMode.
> - *"When should you not use an effect?"* When the value can be calculated from props and state during render.

> [!RECAP]
>
> - Three slots: set up, cleanup, dependency list.
> - Write the cleanup right after the set up line.
> - Twice in dev means a missing cleanup, not a StrictMode bug.

## Shape 3: fetch inside an effect

> [!TLDR]
> Make a canceller, start the download with it, store the result, and cancel in cleanup.
> It is the effect skeleton with a fetch in the set up slot.

Here is the problem this solves.
A search box fetches on every keystroke.
The request for "re" is slow and lands after the one for "react", and it wins.
That is a race condition: two requests, and the older one lands last.

> [!ANALOGY]
> AbortController is a remote control for one download.
> You hand the download its receiver (`signal`), and keep the remote.
> Cleanup presses stop.

> [!THINK]
> What is the first line inside the effect?
> How does the canceller get connected to `fetch`?
> A cancel throws an error; should that error be logged?

```tsx title="fetch-effect.tsx"
useEffect(() => {
  const ac = new AbortController(); // the canceller
  fetch(WORD_URL, { signal: ac.signal }) // wire it in
    .then((r) => r.text()) // or r.json()
    .then((t) => setWord(t.trim())) // store it
    .catch((e) => {
      if (e.name !== "AbortError") console.error(e);
    });

  return () => ac.abort(); // cancel in cleanup
}, []);
```

> [!STEPS]
>
> 1. **Create the AbortController.** First line inside the effect.
> 2. **Pass `{ signal: ac.signal }` to fetch.** That is the wire between the canceller and the download.
> 3. **Read the body.** `r.text()` for a plain word, `r.json()` for data.
> 4. **Store it with the setter.** One `.then`, one setter call.
> 5. **Catch, but ignore `AbortError`.** A cancel is not a failure.
> 6. **Return `() => ac.abort()`.** Same skeleton as Shape 2.

> [!NUANCE]-
>
> - `fetch` does not reject on a 404 or a 500; check `if (!r.ok) throw new Error('HTTP ' + r.status)` when errors matter.
> - You do not need a loading state: `data === null && error === null` already means loading. Less state, fewer bugs.
> - If you do keep `loading`, do not clear it in `finally`: the aborted StrictMode mount also runs `finally`, and the screen flashes empty in dev.
> - Prefer `async`/`await`? Put an async function inside the effect and call it; the effect callback itself stays plain.
> - When the URL depends on a value, such as a search box, put that value in the list; cleanup then cancels the older request.

> [!INTERVIEW]-
>
> - *"How do you cancel a request in flight?"* AbortController, aborted from the effect's cleanup.
> - *"What is a race condition here?"* Two requests, the older one lands last and wins. Aborting in cleanup removes it.
> - *"Does fetch throw on a 500?"* No, only on network failure or abort. Check `r.ok`.
> - *"Would you do this in production?"* No, a data library such as React Query handles caching, retries and cancelling. In an interview you show you know what it does for you.

> [!RECAP]
>
> - Canceller first, `signal` into fetch, abort in cleanup.
> - Ignore `AbortError`; check `r.ok` yourself.
> - Derive loading from `data` being `null` instead of a `finally`.

Next: [Part 2 - timers, lists and forms](#/docs/react-from-memory-timers-lists-forms) adds the remaining shapes and the daily drill.

## Summary

> [!SUMMARY]
>
> - Only about eight shapes need to be typed cold; the rest you explain or look up.
> - State is replaced, never mutated; use the arrow form when the new value depends on the old.
> - Every effect is set up, cleanup, dependency list, with the cleanup written right away.
> - Fetch in an effect: AbortController, `signal`, ignore `AbortError`, abort in cleanup.
> - Something running twice in dev means a missing cleanup.

```quiz
[
  {
    "q": "A Like button handler calls setCount(count + 1) three times in a row. One click raises the number by one, not three. Why?",
    "options": ["React drops repeated setter calls made inside one handler", "All three calls read the same count from this render", "The setter is async, so two calls are still pending", "StrictMode cancels the duplicate calls during development builds"],
    "answer": 1,
    "expl": "count is a plain variable fixed for this render, so each call computes the same number. The arrow form, setCount(n => n + 1), chains correctly. React does not drop calls: it runs all three, they just all say the same thing."
  },
  {
    "q": "A teammate writes users.push(newUser) and then setUsers(users). The new row never appears, and no error shows. What is the cause?",
    "options": ["The setter needs a functional updater before arrays update", "The push call returns a length, not the array itself", "The list is missing keys, so React skips the row", "Same array reference, so React sees no change and skips"],
    "answer": 3,
    "expl": "React compares the old and new state by reference. A pushed array is still the same object, so React bails out of the redraw. The functional updater is a good habit, but it would not help if it still returned the mutated array."
  },
  {
    "q": "Select every approach that updates an array in state without mutating it.",
    "options": ["Filter into a new array that leaves out the removed id", "Push onto the current array, then return that same array", "Map to a new array, spreading a copy of the match", "Copy the array with spread, then sort the fresh copy"],
    "answer": [0, 2, 3],
    "multi": true,
    "expl": "filter and map return new arrays, and sorting a spread copy leaves the original alone. Push changes the existing array, and returning it hands React the same reference, so nothing redraws."
  },
  {
    "q": "An effect adds a window resize listener. After you move between two pages five times, one resize fires the handler five times. What is the fix?",
    "options": ["Return a function from the effect that removes the listener", "Add an empty dependency list so the effect runs once", "Wrap the handler in useCallback so its identity stays stable", "Move the subscription into the component body above the return"],
    "answer": 0,
    "expl": "Each mount added a listener and nothing ever removed one. Cleanup must undo exactly what set up did. An empty list limits runs per mount, but every new mount still adds another listener that outlives it."
  },
  {
    "q": "An effect fetches data and calls setData with the result. It has no dependency list at all. The network tab shows requests without end. Why?",
    "options": ["The fetch promise resolves twice, so the effect is doubled", "StrictMode re-mounts the component after every state change", "No list means it runs after every render, including its own", "The missing AbortController leaves old requests retrying forever"],
    "answer": 2,
    "expl": "With no list the effect runs after every render. It sets state, which causes a render, which runs the effect again. StrictMode only double mounts once at the start in development; it does not remount on state changes."
  },
  {
    "q": "A search box fetches on every keystroke. You type \"react\" quickly, and the results for \"re\" land last and replace the right ones. What is the best fix?",
    "options": ["Store the results in a ref instead of in state", "Abort the previous request in cleanup when the query changes", "Remove the query from the dependency list to fetch once", "Switch from text to json so responses parse in order"],
    "answer": 1,
    "expl": "With the query in the dependency list, cleanup runs before each new fetch, so aborting there kills the older request before it can overwrite newer results. Removing the query from the list stops the race only by never searching again."
  },
  {
    "q": "You add finally { setLoading(false) } to your fetch effect. In development the spinner vanishes and an empty state flashes before the data shows. Production is fine. Why?",
    "options": ["The finally block runs before the awaited fetch has resolved", "Development builds skip the loading state to speed up reloads", "The second mount reuses the first mount's cached empty response", "The aborted first mount still ran finally and cleared loading"],
    "answer": 3,
    "expl": "StrictMode mounts, cleans up and mounts again. The first fetch is aborted, its catch ignores the AbortError, but finally still runs and clears loading while the second fetch is in flight. Deriving loading from data and error being null avoids the whole problem."
  }
]
```

```related
[
  {
    "title": "useState reference",
    "url": "https://react.dev/reference/react/useState",
    "source": "React docs",
    "kind": "read",
    "note": "The setter, the updater function and the batching rules behind Shape 1."
  },
  {
    "title": "Updating arrays in state",
    "url": "https://react.dev/learn/updating-arrays-in-state",
    "source": "React docs",
    "kind": "read",
    "note": "Add, remove, update and sort without mutating - with exercises."
  },
  {
    "title": "Synchronizing with effects",
    "url": "https://react.dev/learn/synchronizing-with-effects",
    "source": "React docs",
    "kind": "read",
    "note": "Set up, cleanup and dependencies, including the StrictMode double mount."
  },
  {
    "title": "You might not need an effect",
    "url": "https://react.dev/learn/you-might-not-need-an-effect",
    "source": "React docs",
    "kind": "read",
    "note": "When a value belongs in the render body instead of an effect."
  },
  {
    "title": "AbortController",
    "url": "https://developer.mozilla.org/en-US/docs/Web/API/AbortController",
    "source": "MDN",
    "kind": "read",
    "note": "The canceller behind Shape 3, and how the signal reaches fetch."
  }
]
```
