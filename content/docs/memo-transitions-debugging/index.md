---
title: Memo, transitions and debugging re-renders
summary: When memoisation pays off, how to mark updates as non-urgent, and a debugging order that finds the real cause.
date: 2026-09-17
part: 2
series: React Rendering
tags: [react, rendering, performance]
minutes: 7
---

[Part 1](#/docs/why-react-rerenders) covered the render and commit steps, the four reasons a component runs again, when React skips work, and keys.

> [!TERMS]
> - **Render** - React calling your component function to find out what it should show now.
> - **Commit** - the moment React writes its changes into the DOM, the browser's live tree of elements.
> - **State** - a value React remembers for a component between renders.
> - **Props** - the inputs a parent passes to a child component.
> - **Context** - a way to pass a value to many components deep in the tree without handing it down as props.
> - **Memoisation (memo)** - remembering a previous result so it can be reused instead of recalculated.
> - **Transition** - an update you mark as not urgent, so React can pause it for something more urgent.
> - **Profiler** - the React DevTools panel that records which components rendered and why.

## Memoisation, and when it does nothing

> [!TLDR]
> `useMemo`, `useCallback` and `memo` all cost a little on every render in exchange for maybe saving work later.
> They pay off when the saved work is big, or when something else depends on the result staying the same object.

> [!ANALOGY]
> Memoising is writing an answer on a sticky note.
> Worth it for a long sum you will need again.
> Silly for "2 + 2", where reading the note takes longer than just doing it.

> [!THINK]
> Look at two calculations: a two-item array, and a big transform whose result goes into a memoised table.
> For each one, ask: is the work expensive, and does anything care that the result is the same object?

```tsx title="rows.tsx"
// Pointless: a tiny array, and nothing depends on it being the same object.
const options = useMemo(() => ['a', 'b'], [])

// Worth it: the transform is expensive, and a memoised table receives the result.
const rows = useMemo(() => transform(raw), [raw])
```

> [!NUANCE]-
> - `useCallback` on a click handler passed to a plain `<button>` saves nothing. The browser element does not care whether the function is the same one.
> - `memo` only blocks re-renders caused by the parent. It does nothing about the component's own state or a context it reads.
> - `memo` fails if you pass an object or function written inline, because it is a new one every render.
> - The **React Compiler** is a build tool that adds this caching for you. It quietly skips any function it cannot prove safe, so one hand-written workaround can switch it off for that whole function.

> [!INTERVIEW]-
> - *When does `useMemo` make things worse?* When the calculation is cheaper than the checking and storing - true for most short arrays and small objects.
> - *Why might adding `memo` change nothing?* The component re-renders because of state or context, or a prop is a new object every time.

> [!RECAP]
> - Memoisation costs a little every render in exchange for maybe saving work.
> - It only pays off for expensive work or results others depend on.

## Urgent and non-urgent updates

> [!TLDR]
> `startTransition` marks an update as "not urgent", so React can pause it to handle something the user just did, like typing.
> It does not make the slow work any faster.

> [!THINK]
> A search box updates the input and a long results list on every keystroke.
> Which of the two updates must feel instant, and which can wait a moment?

```tsx title="search.tsx"
const [isPending, startTransition] = useTransition()

const onType = (value: string) => {
  setQuery(value)                                   // urgent: keep the input responsive
  startTransition(() => setResults(search(value)))  // can be paused
}
```

> [!NUANCE]-
> - React can only pause *between* pieces of work. If `search` itself takes 200ms without stopping, the page is stuck for those 200ms either way.
> - `isPending` lets you show "results updating" without a flashing spinner.
> - Only rendering can be paused. Once React starts committing, it finishes.

> [!RECAP]
> - Transitions mark updates as non-urgent so typing stays responsive.
> - They cannot speed up one long synchronous function.

## A debugging order that works

> [!TLDR]
> Measure first, find the cause above the slow component, move state down, and only then reach for memo.

> [!STEPS]
> 1. **Check it really re-renders.** The React DevTools profiler can tell you exactly why a component rendered. Guessing wastes hours.
> 2. **Find the cause, not the victim.** A small component re-rendering usually means something above it changed.
> 3. **Move state down, or content up.** Most re-render problems are a piece of state living higher up the tree than the thing it controls.
> 4. **Only then reach for `memo`.** Memo added before step 2 tends to move the cost around rather than remove it.

> [!WIN]-
> The fix that always works is keeping state close to where it is used.
> The lower in the tree a piece of state lives, the less of the page its changes can touch - at no runtime cost, and nothing breaks when someone adds a prop.

> [!RECAP]
> - Use the profiler to find why something rendered.
> - Move state down before reaching for memo.

## Summary

> [!SUMMARY]
> - Memoisation trades a small cost every render for maybe saving work later.
> - It pays off only for expensive work or results others depend on staying the same object.
> - Transitions keep typing responsive but cannot speed up one long function.
> - Profile first, fix the cause upstream, and keep state close to where it is used.

```quiz
[
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
    "q": "Your codebase adopts the React Compiler. One hook contains an eslint-disable for exhaustive-deps. The likely consequence is:",
    "options": [
      "The compiler errors and the build fails on that file",
      "The compiler skips optimising that function",
      "The disable is ignored since the compiler replaces the lint rule",
      "Only that one useMemo call loses its memoisation"
    ],
    "answer": 1,
    "expl": "The compiler bails out of code whose hook dependencies it cannot verify, silently dropping memoisation for that scope. It does not fail the build, which is what makes the regression easy to miss."
  },
  {
    "q": "Which statements about startTransition are accurate? Select all that apply.",
    "options": [
      "It lets typing stay responsive during a big re-render",
      "It speeds up the slow function it wraps",
      "isPending tells you the update is still in progress",
      "It can pause React in the middle of committing"
    ],
    "answer": [
      0,
      2
    ],
    "multi": true,
    "expl": "A transition marks the update as non-urgent so React can pause rendering for user input, and isPending reports it. It never makes the work itself faster, and commit is never interrupted."
  },
  {
    "q": "A teammate proposes wrapping a 3-item static options array in useMemo 'for performance'. Your best reply is:",
    "options": [
      "Good idea, since arrays are recreated every render",
      "Skip it, the check costs more than rebuilding it",
      "Use useCallback instead, since it is cheaper",
      "Move it into state so it is never recreated"
    ],
    "answer": 1,
    "expl": "For a tiny array nothing depends on, memoising adds comparison and storage cost for no saving. Moving it outside the component is the cleaner fix if identity ever matters."
  }
]
```

```related
[
  {
    "title": "useMemo",
    "url": "https://react.dev/reference/react/useMemo",
    "source": "React docs",
    "kind": "read",
    "note": "When memoising a calculation is worth it."
  },
  {
    "title": "useCallback",
    "url": "https://react.dev/reference/react/useCallback",
    "source": "React docs",
    "kind": "read",
    "note": "When a stable function actually matters."
  },
  {
    "title": "useTransition",
    "url": "https://react.dev/reference/react/useTransition",
    "source": "React docs",
    "kind": "read",
    "note": "Marking updates as non-urgent."
  },
  {
    "title": "React Compiler",
    "url": "https://react.dev/learn/react-compiler",
    "source": "React docs",
    "kind": "read",
    "note": "The build tool that adds memoisation for you."
  },
  {
    "title": "Tabs",
    "url": "https://www.greatfrontend.com/questions/user-interface/tabs",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "note": "A small component where keeping state in the right place matters."
  }
]
```
