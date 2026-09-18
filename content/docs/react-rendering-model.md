---
title: What actually happens when React re-renders
summary: Render phase, commit phase, bailouts, and the four reasons a component runs again.
date: 2026-09-16
tags: [react, rendering, performance]
minutes: 14
---

## The big picture

> [!TLDR]
> "Re-render" means React called your component function again. It does not mean
> the DOM changed. Those are two separate phases, and almost every performance
> mistake comes from conflating them.

<svg viewBox="0 0 720 200" role="img" aria-label="Render phase feeds into commit phase">
  <rect x="10" y="40" width="200" height="90" rx="12" fill="none" stroke="var(--primary)" stroke-width="2"/>
  <text x="110" y="70" text-anchor="middle" font-size="15" font-weight="600" fill="var(--text)">Render phase</text>
  <text x="110" y="92" text-anchor="middle" font-size="12" fill="var(--text-muted)">call components</text>
  <text x="110" y="110" text-anchor="middle" font-size="12" fill="var(--text-muted)">diff the tree</text>
  <path d="M215 85 H285" stroke="var(--text-muted)" stroke-width="2" fill="none"/>
  <path d="m278 79 8 6-8 6" stroke="var(--text-muted)" stroke-width="2" fill="none"/>
  <rect x="290" y="40" width="200" height="90" rx="12" fill="none" stroke="var(--accent)" stroke-width="2"/>
  <text x="390" y="70" text-anchor="middle" font-size="15" font-weight="600" fill="var(--text)">Commit phase</text>
  <text x="390" y="92" text-anchor="middle" font-size="12" fill="var(--text-muted)">mutate the DOM</text>
  <text x="390" y="110" text-anchor="middle" font-size="12" fill="var(--text-muted)">run layout effects</text>
  <path d="M495 85 H565" stroke="var(--text-muted)" stroke-width="2" fill="none"/>
  <path d="m558 79 8 6-8 6" stroke="var(--text-muted)" stroke-width="2" fill="none"/>
  <rect x="570" y="40" width="140" height="90" rx="12" fill="none" stroke="var(--ok)" stroke-width="2"/>
  <text x="640" y="78" text-anchor="middle" font-size="15" font-weight="600" fill="var(--text)">Paint</text>
  <text x="640" y="100" text-anchor="middle" font-size="12" fill="var(--text-muted)">browser draws</text>
  <text x="110" y="160" text-anchor="middle" font-size="12" fill="var(--text-muted)">interruptible</text>
  <text x="390" y="160" text-anchor="middle" font-size="12" fill="var(--text-muted)">synchronous, never interrupted</text>
</svg>

The render phase is pure and interruptible. React may start it, throw the work
away, and start again. The commit phase is synchronous and happens once.

> [!NUANCE]
> Because the render phase can be discarded and re-run, anything with a side
> effect placed in the component body can happen more than once per visible
> update - or zero times. This is also why StrictMode double-invokes components
> in development: it is surfacing that assumption, not introducing a bug.

## The four reasons a component runs again

> [!TLDR]
> State changed, a parent re-rendered, a consumed context changed, or the
> component's own hook order forced it. Props changing is not on the list.

> [!STEPS]
> 1. **Its own state changed.** A `useState` or `useReducer` setter dispatched a
>    value React does not consider equal.
> 2. **Its parent re-rendered.** By default the child is called again regardless
>    of whether its props differ.
> 3. **A context it consumes changed value.** `memo` does not stop this.
> 4. **A hook it uses told it to.** `useSyncExternalStore` firing, for example.

```tsx
const Parent = () => {
  const [n, setN] = useState(0)

  // Child re-renders on every click even though its props never change.
  return (
    <>
      <Button onClick={() => setN(n + 1)}>{n}</Button>
      <Child label="static" />
    </>
  )
}
```

> [!NUANCE]
> - Props changing does not itself trigger anything. Props change *because* the
>   parent re-rendered, and the parent re-rendering is the actual cause.
> - `React.memo` intercepts reason 2 only. It compares props shallowly and skips
>   the call if they match. It has no effect on state or context.
> - Children passed as a `children` prop are created by the parent, so they are
>   the same element object across the parent's re-renders and React can bail
>   out on that subtree. This is why "lift the expensive part into `children`"
>   works without any memo at all.

> [!INTERVIEW]
> - *Does `memo` prevent a re-render caused by context?* No. Context propagates
>   to consumers directly and bypasses the memo comparison.
> - *Why does passing `<Expensive />` as `children` avoid re-rendering it?* The
>   element is created in the grandparent's scope, so its identity is stable and
>   React bails out on the unchanged subtree.

## Bailouts

> [!TLDR]
> React skips work at two levels: state bailout when the new state is
> `Object.is`-equal to the old, and element bailout when the new element is
> reference-identical to the previous one.

```tsx
const [user, setUser] = useState({ name: 'Ada' })

setUser(user)                     // bails out, same reference
setUser({ ...user })              // re-renders, new object
setUser((u) => ({ ...u }))        // re-renders, new object
```

> [!NUANCE]
> - The state bailout is not guaranteed to skip the render call. React may still
>   call your component once more before settling, so never rely on it for
>   correctness.
> - Object and array state loses the bailout entirely, because a fresh object is
>   never `Object.is`-equal to the old one. Store primitives where you can.
> - A bailout stops at the component. Its children are not re-rendered, which is
>   why a bailout high in the tree is worth far more than one at a leaf.

## Keys and identity

> [!TLDR]
> A key tells React which element in a list corresponds to which element from
> the previous render. Get it wrong and React reuses the wrong component
> instance, carrying its state to the wrong row.

Using an array index as a key is correct only for a list that is append-only and
never reordered, filtered, or deleted from the middle. Anything else and state
smears across rows.

> [!GOTCHA]
> Changing a component's `key` unmounts and remounts it, destroying all its
> state. This is a legitimate tool - `<Form key={userId} />` resets the form
> when the user changes - but it also means an accidentally unstable key, like
> one built from `Math.random()`, remounts the subtree on every single render.

## Memoisation, and when it does nothing

> [!TLDR]
> `useMemo`, `useCallback` and `memo` all pay a cost on every render to maybe
> save work on the next one. They pay off when the saved work is large or the
> memoised value feeds a dependency array.

```tsx
// Pointless: the array is cheap and nothing downstream depends on its identity.
const options = useMemo(() => ['a', 'b'], [])

// Worth it: rows is expensive, and its identity feeds a memoised table.
const rows = useMemo(() => transform(raw), [raw])
```

> [!NUANCE]
> - `useCallback` on a handler passed to a plain DOM element saves nothing. The
>   DOM node does not care about function identity.
> - `memo` with an object or function prop that is recreated inline fails on
>   every render. The comparison is shallow, so a new reference is a miss.
> - The React Compiler memoises automatically at build time, which makes most
>   hand-written `useMemo` redundant. It bails out of files or functions it
>   cannot prove safe, so a manual escape hatch in one hook can silently drop
>   the optimisation for that whole function.

> [!INTERVIEW]
> - *When is `useMemo` actively harmful?* When the computation is cheaper than
>   the comparison plus allocation, which is most of the time for short arrays
>   and simple objects.
> - *Why might adding `memo` change nothing?* Because the component re-renders
>   from state or context, or because a prop is a fresh object every render.

## Transitions and priority

> [!TLDR]
> `startTransition` marks an update as non-urgent, so React can interrupt it to
> process something the user did. It does not make the work faster.

```tsx
const [isPending, startTransition] = useTransition()

const onType = (value: string) => {
  setQuery(value)                                   // urgent, keeps the input responsive
  startTransition(() => setResults(search(value)))  // interruptible
}
```

> [!NUANCE]
> - A transition cannot interrupt itself out of a slow synchronous function. If
>   `search` blocks for 200ms, that 200ms still blocks the main thread.
> - `isPending` gives you a place to show staleness without a spinner flash.
> - Only the render phase is interruptible. Once React commits, it finishes.

## A debugging order that works

> [!STEPS]
> 1. **Confirm it re-renders at all.** The React DevTools profiler's "why did
>    this render" is the ground truth; guessing wastes hours.
> 2. **Find the cause, not the component.** A leaf re-rendering usually means a
>    provider or a parent above it changed.
> 3. **Move state down, or content up.** Most re-render problems are a state
>    variable living higher in the tree than the thing it controls.
> 4. **Only then reach for memo.** Memo applied without step 2 tends to relocate
>    the cost rather than remove it.

> [!WIN]
> The reliable structural fix is state colocation: the further down the tree a
> piece of state lives, the smaller the subtree its updates can invalidate. It
> costs nothing at runtime and does not break when someone adds a prop.

```quiz
[
  {
    "q": "A leaf component wrapped in React.memo re-renders on every keystroke in an unrelated input. Which explanation fits best?",
    "options": [
      "It consumes a context whose provider value is new each render",
      "Its parent re-renders and memo only delays the update",
      "memo comparison is deep so nested props always differ",
      "Keystrokes are urgent updates and memo is ignored for them"
    ],
    "answer": 0,
    "expl": "Context bypasses memo entirely: a provider whose value is a fresh object each render notifies every consumer. Memo does block parent-driven renders, so option one is the thing memo actually handles."
  },
  {
    "q": "Which of these cause a component function to be called again? Select all that apply.",
    "options": [
      "Its own useState setter dispatched a different value",
      "Its props object changed while the parent did not render",
      "A context it reads changed value",
      "Its parent re-rendered with identical props"
    ],
    "answer": [
      0,
      2,
      3
    ],
    "multi": true,
    "expl": "State, context and a parent render are the triggers. Props cannot change without the parent rendering, so option two describes something that cannot happen on its own."
  },
  {
    "q": "You call setUser(user) with the exact same object reference. What does React guarantee?",
    "options": [
      "The component will not be called again under any condition",
      "The DOM will not be touched but the component may re-run",
      "Both render and commit are skipped and effects still fire",
      "The update is queued until another state change flushes it"
    ],
    "answer": 1,
    "expl": "Object.is equality lets React bail out, but the docs are explicit that it may still call the component once more before deciding. Relying on the bailout for correctness is the trap."
  },
  {
    "q": "A list uses the array index as its key. Rows are filtered by a search box. What breaks?",
    "options": [
      "The list re-renders more often than strictly necessary",
      "React logs a duplicate-key warning on every filter",
      "Component state attaches to the wrong row after filtering",
      "Nothing, since indices stay unique within each render"
    ],
    "answer": 2,
    "expl": "Filtering shifts which item sits at each index, so React reuses the instance previously at that position and its state moves to a different row. Indices are unique, which is exactly why no warning appears."
  },
  {
    "q": "Why does passing an expensive subtree as `children` avoid re-rendering it when the wrapper's state changes?",
    "options": [
      "The children prop is compared deeply by React internals",
      "React defers children rendering to a lower priority lane",
      "The wrapper is memoised automatically when it has children",
      "The element comes from an outer scope, so identity is stable"
    ],
    "answer": 3,
    "expl": "The grandparent creates the element, so across the wrapper's re-renders it is the same object and React bails out on that subtree. No comparison or memoisation is involved."
  },
  {
    "q": "A team wraps every callback in useCallback, including handlers passed to plain <input> elements. The measured effect on those inputs is:",
    "options": [
      "No gain, plus the cost of the hook on every render",
      "A small gain from fewer event listener rebinds",
      "A loss, because stale closures force extra renders",
      "A gain only when the parent re-renders frequently"
    ],
    "answer": 0,
    "expl": "DOM elements do not care about function identity, so there is nothing to save. You still pay allocation and dependency comparison on every render."
  },
  {
    "q": "StrictMode in development calls your component twice. What is it revealing?",
    "options": [
      "That effects need cleanup functions to be correct",
      "That the render phase must be free of side effects",
      "That state updates during render are always unsafe",
      "That the commit phase can run more than once"
    ],
    "answer": 1,
    "expl": "Double-invoking surfaces impure render logic, since React reserves the right to discard and re-run a render. The commit phase is not doubled; effect double-mounting is a separate StrictMode behaviour."
  },
  {
    "q": "startTransition wraps a call to a synchronous search function that blocks for 200ms. What does the user experience?",
    "options": [
      "Typing stays smooth because the work is interruptible",
      "The search is dropped and only the last one executes",
      "Typing stalls for 200ms because the function blocks",
      "React moves the work to a worker thread automatically"
    ],
    "answer": 2,
    "expl": "A transition lets React interrupt between units of render work; it cannot interrupt inside one synchronous function call. The main thread is blocked either way."
  },
  {
    "q": "Which statements about React.memo are accurate? Select all that apply.",
    "options": [
      "It compares props with a shallow equality check",
      "It prevents re-renders caused by the component's own state",
      "It fails when a prop is an inline object literal",
      "It stops context updates from reaching the component"
    ],
    "answer": [
      0,
      2
    ],
    "multi": true,
    "expl": "Memo is a shallow prop comparison, so a fresh inline object is always a miss. It has no bearing on the component's own state, and context deliberately bypasses it."
  },
  {
    "q": "Profiling shows a deep leaf is slow. DevTools says it rendered because its parent rendered, and the parent because a provider value changed. Where do you fix it?",
    "options": [
      "Wrap the leaf in memo with a custom comparator",
      "Move the leaf's own state into a reducer",
      "Wrap the leaf's render output in a transition",
      "Stabilise the provider value or split the context"
    ],
    "answer": 3,
    "expl": "The cause is upstream, so fixing the leaf relocates the cost rather than removing it. A stable provider value, or a context split so fewer consumers care, addresses the actual trigger."
  },
  {
    "q": "A component's key is computed as `key={`${row.id}-${Date.now()}`}`. What happens?",
    "options": [
      "The subtree unmounts and remounts on every render",
      "React warns about unstable keys and falls back to index",
      "Nothing changes, since the id prefix keeps it unique",
      "Reconciliation is skipped and the DOM updates directly"
    ],
    "answer": 0,
    "expl": "A key that differs between renders makes React treat it as a different element, destroying and recreating the instance and all its state. There is no warning for this."
  },
  {
    "q": "Your codebase adopts the React Compiler. One hook contains an eslint-disable for exhaustive-deps. The likely consequence is:",
    "options": [
      "The compiler errors and the build fails on that file",
      "The compiler skips optimising that function",
      "The disable is ignored since the compiler replaces the lint rule",
      "Only that one useMemo call loses its memoisation"
    ],
    "answer": 1,
    "expl": "The compiler bails out of code whose hook dependencies it cannot verify, silently dropping memoisation for that scope. It does not fail the build, which is what makes the regression easy to miss."
  }
]
```
