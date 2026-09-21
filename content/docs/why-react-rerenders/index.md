---
title: Why React re-renders
summary: Render versus commit, the four reasons a component runs again, when React skips work, and keys.
date: 2026-09-17
part: 1
series: React Rendering
tags: [react, rendering, performance]
topic: React fundamentals
minutes: 8
---

> [!TERMS]
> - **Component** - a function that returns what a piece of the screen should look like.
> - **Render** - React calling your component function to find out what it should show now.
> - **Re-render** - React calling it again, because something may have changed.
> - **DOM** - the browser's live tree of elements. Changing it is what actually changes the screen.
> - **Commit** - the moment React writes its changes into the DOM.
> - **State** - a value React remembers for a component between renders.
> - **Props** - the inputs a parent passes to a child component.
> - **Context** - a way to pass a value to many components deep in the tree without handing it down as props.
> - **Key** - a label on a list item that tells React which item is which between renders.

## The big picture

> [!TLDR]
> "Re-render" means React called your component function again.
> It does **not** mean the screen changed.
> Those are two separate steps, and most React performance mistakes come from mixing them up.

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

> [!ANALOGY]
> Rendering is an architect redrawing the plans.
> Committing is the builders actually changing the house.
> An architect can redraw the plans ten times and throw nine away - the house only changes once.

The **render** step is React working out what the screen *should* look like.
It can be paused, thrown away and restarted.
The **commit** step is React making the real changes to the page, and it happens once, all at once.

> [!NUANCE]-
> Because React may throw a render away and run it again, anything with a side effect written straight in your component - sending a request, writing to storage - might happen twice, or never.
> That is why React's development-only "StrictMode" deliberately calls your components twice: to flush out that mistake, not to cause one.

> [!RECAP]
> - A re-render is React calling your function again; the screen may not change.
> - Render can be thrown away and redone; commit happens once.

## The four reasons a component runs again

> [!TLDR]
> A component re-renders when its own state changes, its parent re-renders, a context it reads changes, or a hook it uses tells it to.
> "Its props changed" is not on the list.

> [!STEPS]
> 1. **Its own state changed.** A state setter was called with a new value.
> 2. **Its parent re-rendered.** By default the child runs again too, even if its props are identical.
> 3. **A context it reads changed.** Every component reading that context runs again.
> 4. **A hook asked it to.** For example, a hook subscribed to an outside store that just changed.

> [!THINK]
> A parent holds a counter, and a child gets a fixed text prop that never changes.
> You click the counter button.
> Does the child run again? Which of the four reasons applies?

```tsx title="parent.tsx"
const Parent = () => {
  const [n, setN] = useState(0)

  // Child runs again on every click, even though its props never change.
  return (
    <>
      <Button onClick={() => setN(n + 1)}>{n}</Button>
      <Child label="static" />
    </>
  )
}
```

> [!NUANCE]-
> - Props never change on their own. They change *because* the parent re-rendered - so the parent is the real cause.
> - `React.memo` only blocks reason 2. It checks whether the props look the same, and skips the child if they do. It does nothing about state or context. Part 2 covers it properly.
> - Passing something as `children` is a neat trick: the parent's parent creates it, so it stays the exact same object when the parent re-renders, and React skips it.

> [!INTERVIEW]-
> - *Does `memo` stop a re-render caused by context?* No. Context goes straight to every component that reads it.
> - *Why does passing `<Expensive />` as `children` avoid re-rendering it?* It was created higher up, so it is the same object each time, and React skips unchanged objects.

> [!RECAP]
> - State, a parent re-render, context, or a hook - those are the four triggers.
> - Props only change because the parent re-rendered.

## When React skips work

> [!TLDR]
> React skips work in two places: when new state is exactly the same value as old state, and when a child element is exactly the same object as last time.

"Exactly the same" here means React's `Object.is` check.
For numbers and text, same value means same.
For objects and arrays, only *the very same object* counts - two objects with identical contents are still different.

> [!THINK]
> You have a user object in state.
> One call passes back the same object, another passes a copy with identical contents.
> Which one can React skip, and why?

```tsx title="user-state.tsx"
const [user, setUser] = useState({ name: 'Ada' })

setUser(user)               // same object: React can skip
setUser({ ...user })        // a new object with the same contents: re-renders
```

> [!NUANCE]-
> - The skip is not a promise. React may still call your component once more before it settles, so never rely on it for correctness.
> - Object and array state almost never gets the skip, because you normally create a new one. Keep simple values in state where you can.
> - A skip stops everything below it too, so a skip near the top of the page saves far more than one at the bottom.

> [!RECAP]
> - React skips work when new state is the very same value or object.
> - A skip near the top of the page saves the most.

## Keys: telling list items apart

> [!TLDR]
> A `key` tells React which item in a list is which from one render to the next.
> Get it wrong and React reuses the wrong component, so one item's state shows up on another.

> [!ANALOGY]
> Keys are name tags at a party.
> Without them React greets people by where they are standing, and gets confused the moment anyone moves.

Using the array position as the key only works for a list that never gets reordered, filtered or has items removed from the middle.

> [!GOTCHA]
> Changing a component's `key` throws it away and builds a fresh one, wiping its state.
> That can be useful on purpose - `<Form key={userId} />` resets the form when the user changes.
> But a key that accidentally changes every render, like one built from `Math.random()`, rebuilds that part of the page on *every* render, losing typed text and focus.

> [!RECAP]
> - Keys tell React which list item is which between renders.
> - A key that changes every render rebuilds that part of the page.

## Summary

> [!SUMMARY]
> - Rendering is working out the screen; committing is changing it.
> - Components re-render because of state, a parent, context or a hook - not because props changed on their own.
> - React skips work only for the very same value or object.
> - Stable keys keep each list item's state attached to the right item.

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
    "q": "A todo list keys rows by a stable todo.id. A user deletes the second todo. Which statements are true? Select all that apply.",
    "options": [
      "The remaining rows keep their own typed-in state",
      "React destroys and rebuilds every row below it",
      "Only the deleted row's component is removed",
      "Rows shift state up by one position"
    ],
    "answer": [
      0,
      2
    ],
    "multi": true,
    "expl": "A stable id lets React match each surviving row to its old component, so only the deleted one goes away. Shifting state and rebuilding everything are what index keys or unstable keys cause."
  }
]
```

```related
[
  {
    "title": "Render and commit",
    "url": "https://react.dev/learn/render-and-commit",
    "source": "React docs",
    "kind": "read",
    "note": "The official explanation of the two phases in this doc."
  },
  {
    "title": "Preserving and resetting state",
    "url": "https://react.dev/learn/preserving-and-resetting-state",
    "source": "React docs",
    "kind": "read",
    "note": "How position and keys decide which component keeps which state."
  },
  {
    "title": "memo",
    "url": "https://react.dev/reference/react/memo",
    "source": "React docs",
    "kind": "read",
    "note": "What memo compares, and the cases it cannot help."
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
