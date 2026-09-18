---
title: The seven-step method
summary: Turn any dense instruction into a table of verbs, inputs and outputs in under three minutes, before you write a line of code.
date: 2026-09-17
part: 1
series: Dissecting Problem Statements
tags: [problem-solving, interviews, planning]
minutes: 12
---

> [!TERMS]
>
> - **Problem statement** - the block of text that tells you what to build, like a paragraph, a README or a chat message.
> - **Verb** - a doing word: the action you must perform, like fetch, sort, render or cancel.
> - **Input** - what one verb starts with, like a list of invoices, a string or a click.
> - **Output** - the one thing a verb hands you when it is done, like a sorted list or a rendered row.
> - **Dissection table** - one row per verb, with three columns: verb, input, output.
> - **Constraint** - a rule about how, not a step; it never produces a thing, like "no libraries".
> - **Invariant** - something that must stay true the whole time, like "headers never leak between requests".
> - **Acceptance criteria** - the list a grader ticks to decide whether you passed.
> - **Pending** - a request that has been sent and has not come back yet.

## The big picture

> [!TLDR]
> A dense instruction is never one idea.
> It is a list of verbs, and each verb makes exactly one thing; write the list down and the fear goes.

You read a task.
It is seven lines long, it has four words you half know, and your hands want to open an editor.
That urge is the enemy.
Every requirement you skip now becomes a bug you find at minute forty, with the timer running.

The fix is a small ritual.
You turn the paragraph into a table, then say the plan out loud, and only then type.

> [!ANALOGY]
> Think of a recipe card.
> A chef does not cook from a paragraph; they list each step, what goes in, and what comes out.
> "Whisk: eggs and sugar, gives a pale mix." Once every step is on the card, cooking is just following it.

<svg viewBox="0 0 720 150" role="img" aria-label="The statement becomes underlined verbs, then a table, then three spoken sentences">
  <rect x="8" y="42" width="140" height="56" rx="10" fill="none" stroke="var(--primary)" stroke-width="2"/>
  <text x="78" y="66" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text)">the statement</text>
  <text x="78" y="84" text-anchor="middle" font-size="11" fill="var(--text-muted)">one scary block</text>
  <path d="M152 70 h36" stroke="var(--text-muted)" stroke-width="2"/>
  <path d="M184 65 L190 70 L184 75" fill="none" stroke="var(--text-muted)" stroke-width="2"/>
  <rect x="192" y="42" width="140" height="56" rx="10" fill="none" stroke="var(--info)" stroke-width="2"/>
  <text x="262" y="66" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text)">verbs underlined</text>
  <text x="262" y="84" text-anchor="middle" font-size="11" fill="var(--text-muted)">4 to 7 of them</text>
  <path d="M336 70 h36" stroke="var(--text-muted)" stroke-width="2"/>
  <path d="M368 65 L374 70 L368 75" fill="none" stroke="var(--text-muted)" stroke-width="2"/>
  <rect x="376" y="42" width="140" height="56" rx="10" fill="none" stroke="var(--accent)" stroke-width="2"/>
  <text x="446" y="66" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text)">the table</text>
  <text x="446" y="84" text-anchor="middle" font-size="11" fill="var(--text-muted)">verb, input, output</text>
  <path d="M520 70 h36" stroke="var(--text-muted)" stroke-width="2"/>
  <path d="M552 65 L558 70 L552 75" fill="none" stroke="var(--text-muted)" stroke-width="2"/>
  <rect x="560" y="42" width="150" height="56" rx="10" fill="none" stroke="var(--ok)" stroke-width="2"/>
  <text x="635" y="66" text-anchor="middle" font-size="12" font-weight="700" fill="var(--text)">three sentences</text>
  <text x="635" y="84" text-anchor="middle" font-size="11" fill="var(--text-muted)">said before typing</text>
</svg>

Here is the whole method, with a clock on each step.

Table: each row is one step, how long it should take, and what you hold at the end of it.

| #   | Step                                                        | Time | You now have                               |
| --- | ----------------------------------------------------------- | ---- | ------------------------------------------ |
| 1   | Write, do not hold: paste the statement into a scratch file | 20s  | the text in front of you, not in your head |
| 2   | Underline every verb, including every "should"              | 20s  | a list of actions                          |
| 3   | One row per verb: verb, input, output                       | 60s  | the dissection table                       |
| 4   | Circle unknown words, write one plain line each, re-read    | 40s  | a table with no fog left                   |
| 5   | Pull every must, must not and only into a rules list        | 20s  | a sticky note of constraints               |
| 6   | Name the ONE thing each step hands the next                 | 20s  | the chain, start to finish                 |
| 7   | Say the plan out loud in three sentences                    | 20s  | a spoken plan, before any typing           |

The budget is under three minutes for a paragraph and under eight for a whole README.
If you are past that, you are already coding in your head.
Stop and finish the table.

> [!NUANCE]-
>
> - The table is not documentation. It is a crutch for working memory; throw it away after you code.
> - Three columns, never four. Adding "notes" turns the table back into prose.
> - Work in a scratch file, not a comment in the real file. Comments get committed and go stale.

> [!INTERVIEW]-
>
> - _How do you approach an ambiguous spec?_ List the verbs, name the output of each, and confirm those outputs out loud.
> - _What would you clarify first?_ The unknown word that sits next to a verb. Nouns can wait.
> - Saying "three things: fetch, animate, render" in the first minute is the strongest opening move you have.
> - An interviewer watching you build this table reads it as structure, not slowness. Narrate it.

> [!RECAP]
>
> - A statement is a list of verbs, and each verb makes one thing.
> - Seven steps, under three minutes: text, verbs, table, words, rules, chain, three sentences.
> - No code until the table and the spoken plan both exist.

## The seven steps, worked on one statement

> [!TLDR]
> We run all seven steps on one real take-home requirement list.
> The output is a table, a word list, a rules list and three sentences.

Here is the statement, run together the way it was actually written.
It comes from a take-home challenge where you fetch a hidden word and animate it.

> "Fetch the hidden URL using browser APIs only. Render "Loading..." while the request is pending. Render the flag as a list, one `<li>` per character. Add a typewriter effect with a half-second delay per character, starting from nothing. The animation triggers only after the flag loads, and runs only once. React APIs only: no CSS, no libraries."

> [!STEPS]
>
> 1. **Write, do not hold.** Paste it into `notes.md`; memory rewrites text slightly every time you recall it.
> 2. **Underline every verb.** Here: fetch, render, render, add, triggers, runs. Six actions.
> 3. **One row per verb.** The output column is the whole point: each verb makes exactly one thing.
> 4. **Circle unknown words.** Resolve each in one line, then re-read the table.
> 5. **Pull the constraints out.** Anything with must, must not, only or no is a rule, not a step.
> 6. **Name the one handoff per step.** Fetch hands a string, the string hands a length, the length hands a list.
> 7. **Say the plan in three sentences.** Out loud, even alone. If you cannot, the table is not finished.

Step 3 gives you this table.

```text title="notes.md - the dissection table" open
verb      -> input                    -> output
--------------------------------------------------------------
fetch     -> the hidden URL           -> one string, the flag
render    -> flag is still null       -> the text "Loading..."
render    -> the flag string          -> one <li> per character
add       -> a 500ms timer            -> a count of visible letters
triggers  -> flag stopped being null  -> the timer, started once
runs      -> nothing                  -> (no output: this is a rule)
```

Read the last row again.
"Runs only once" makes nothing.
It is a constraint wearing a verb's clothes, so it moves to the rules list.

Step 4 clears the fog.

Table: each row is a word you circled and the one plain line that resolves it.

| Word              | One plain line                                                      |
| ----------------- | ------------------------------------------------------------------- |
| browser APIs only | use commands the browser already has, like `fetch`; install nothing |
| pending           | the request has been sent and has not come back yet                 |
| flag              | the one secret word this challenge wants                            |
| typewriter effect | letters appear one at a time, like someone typing                   |

Step 5 gives you the rules list:

- React APIs only. No libraries.
- No CSS at all, so "Loading..." is a plain paragraph, never a spinner.
- One `<li>` per character, not one `<li>` holding the whole word.
- The animation starts only after the flag exists, and runs once.

Step 7 gives you three sentences:

1. I fetch the URL in an effect and put the text in state, showing "Loading..." while that state is still null.
2. A second effect watches that state, and once it is a string it starts a half-second interval that counts visible letters up.
3. I render the first N characters as one list item each, and clear the interval on cleanup so a double mount cannot double the speed.

> [!GOTCHA]
> Every verb you leave out of the table becomes a bug you find at minute forty.
> "One `<li>` per character" and "start from nothing" are two separate requirements, and the second is the one people drop.
> If a phrase changes what appears on screen, it earns a row.

> [!RECAP]
>
> - Six verbs, but only four produce something; the other two are rules, and that ratio is normal.
> - Resolve each unknown word in one line before you plan.
> - Three sentences is the test that the table is finished.

## From table to code

> [!TLDR]
> Once the table exists, the code is a transcript of it.
> Here that means two effects, one per group of verbs.

> [!THINK]
> Look at the table: which rows run once when the page opens, and which rows wait for the flag?
> How many `useEffect` calls does that suggest?
> Where in the code does "runs only once" show up, if it makes nothing?

```tsx title="app.tsx"
useEffect(() => {
  // verb 1: fetch -> one string
  fetch(FLAG_URL)
    .then((r) => r.text())
    .then((t) => setFlag(t.trim()));
}, []);

useEffect(() => {
  // verbs 4 and 5: the timer, only after the flag exists
  if (flag === null) return;

  const id = setInterval(
    () => setShown((n) => Math.min(n + 1, flag.length)),
    500,
  );

  return () => clearInterval(id); // the "runs once" rule, enforced
}, [flag]);
```

Read it line by line:

- Effect one has an empty dependency list, so it runs on mount and never again.
- `setFlag` flips the state from null to a string exactly once.
- Effect two returns early while the flag is null: that is "triggers only after the flag loads".
- `setShown((n) => ...)` reads the previous count, so no stale value sneaks in.
- `clearInterval` in the cleanup is what makes the animation run once, not twice.

> [!NUANCE]-
>
> - Two verbs that share an input usually become one function. Two that do not must not be merged.
> - Write the output column first if you are stuck. Working backwards from "what appears" finds verbs you skipped.
> - Passive voice hides verbs. Rewrite "the animation is triggered" as "I trigger the animation" and the input appears.
> - Keep the table open while you code and tick a row when it is done. That is your progress bar.

> [!INTERVIEW]-
>
> - _Walk me through your approach._ Read your output column aloud, in order. That is the walkthrough.
> - _Why two effects?_ Two concerns, two triggers: one runs on mount, one runs when the flag arrives.
> - _What did you assume?_ Anything you resolved in step 4 without asking. Say it before they find it.
> - If a row has no clear output, that is your clarifying question. Ask exactly that.

> [!RECAP]
>
> - The code mirrors the table: one effect per group of verbs.
> - A constraint row still shows up in code, here as a cleanup and a dependency list.
> - Tick rows as you finish them.

## Grade yourself, then build the habit

> [!TLDR]
> Five yes-or-no checks decide whether you start coding.
> Any "no" is the exact thing you do not understand yet.

Table: each row is one check, and how you can tell it failed.

| #   | Check                                  | How you know it failed                          |
| --- | -------------------------------------- | ----------------------------------------------- |
| 1   | Every verb in the statement has a row  | you can point at a verb that is in no row       |
| 2   | Every row has exactly one output       | an output cell contains the word "and"          |
| 3   | No undefined word is left in the table | you would hesitate to explain a word out loud   |
| 4   | The constraints are on their own list  | a "must not" is sitting in the table as a step  |
| 5   | You said the plan in three sentences   | you ran out of breath, or needed five sentences |

Scoring is simple.
Five out of five, start typing.
Four, fix the one and start typing.
Three or fewer, you are about to write code you will delete.

Check 5 is the one people skip and the one that catches the most.
If you cannot say the plan in three sentences, it is never because you talk badly.
It is because two of your rows secretly depend on something you have not decided yet.

> [!STEPS]
>
> 1. **Open a scratch file and paste.** Never dissect in your head.
> 2. **Verbs, then table, then unknowns, then rules.** Always that order.
> 3. **Run the five checks.** Out loud, one word each: verbs, outputs, words, rules, plan.
> 4. **Say the three sentences.** Then start with the row whose output is easiest to see on screen.
> 5. **Tick rows as you finish them.** The table is your progress bar and your stop condition.

The habit takes under 25 minutes a week.

Table: each row is when you practise, what you do, and how long it takes.

| When                 | What you do                                                                     | Time  |
| -------------------- | ------------------------------------------------------------------------------- | ----- |
| Every working day    | dissect one real thing before coding it: a ticket, a PR description, a chat ask | 3 min |
| Mon, Wed, Fri        | one drill from Part 3, timer on, answer closed                                  | 3 min |
| Friday               | look at the rows you dropped this week and name the pattern                     | 5 min |
| Before any interview | dissect two statements cold, out loud, to a wall                                | 8 min |

> [!WIN]-
> Three minutes in, you have a table, a rules list and three spoken sentences.
> You have typed no code and you are ahead, because every row is a thing you would otherwise discover at minute forty.

> [!NUANCE]-
>
> - Do not order rows by difficulty. Order them by what hands something to the next row.
> - If new rows appear while coding, add them to the table rather than holding them in your head.
> - A table older than the code is a lie. Update it or throw it away.
> - In a fifty-minute round, three minutes here is 6 percent of the time for a plan you can defend the whole hour.

> [!INTERVIEW]-
>
> - _Take me through your process._ Verbs, outputs, unknowns, rules, three sentences.
> - _You are being slow._ Say what you are doing: "listing the outputs so I do not miss a requirement." It reads as control.
> - _Anything you would do differently?_ Name the row you added late. It shows you track your own misses.

> [!RECAP]
>
> - Five checks: verbs, one output each, no fog, rules apart, three sentences.
> - Failing check 5 means a row depends on an undecided thing.
> - A few minutes a day turns the table into reflex.

## Summary

> [!SUMMARY]
>
> - A problem statement is a list of verbs; each verb makes exactly one output.
> - Seven steps in under three minutes: paste, underline, table, resolve words, pull rules, chain, three sentences.
> - A verb that makes nothing is a constraint and goes on the rules list.
> - The code is a transcript of the table; tick rows as you go.
> - Five yes-or-no checks decide when to start typing.

Next, [Part 2](#/docs/dissecting-problems-four-types) shows how the table changes shape for four kinds of task.

```quiz
[
  {
    "q": "A ticket says: \"Fetch the orders, group them by customer, and show one row per customer.\" Which verb table matches it?",
    "options": ["group makes orders, fetch makes buckets, show makes totals", "fetch makes orders, show makes one row per order", "fetch makes orders, group makes buckets, show makes rows", "fetch makes customers, group makes orders, show makes totals"],
    "answer": 2,
    "expl": "Three verbs, so three rows, each naming the one thing it produces. The two-row version is tempting because it keeps fetch and show, but it drops group and then renders the wrong grain: one row per order instead of per customer."
  },
  {
    "q": "You meet \"Debounce the input, then abort the in-flight request\" and do not know two of its words. Which do you resolve first?",
    "options": ["input, since the whole sentence is about it", "then, since it fixes the order of work", "request, since every other word describes it", "in-flight, since it sits next to a verb"],
    "answer": 3,
    "expl": "Resolve the unknown word attached to a verb first: abort what, exactly? Plain nouns like request can wait, because you can build the row without them."
  },
  {
    "q": "Your table for a small app has six rows. One reads: \"runs only once.\" What should happen to that row?",
    "options": ["Keep it, since it changes what appears on screen", "Move it to the constraints list, as a rule", "Split it into two rows, one per effect involved", "Delete it, because the cleanup already covers it"],
    "answer": 1,
    "expl": "It produces nothing, so it is a constraint wearing a verb's clothes and belongs on the rules list you re-read before submitting. Deleting it loses a requirement that graders check."
  },
  {
    "q": "Select all of the following that belong on the constraints list rather than in the verb table.",
    "options": ["React APIs only, and no outside libraries", "Keep every data-testid exactly where it is", "Render one list item for each character", "Fetch the hidden URL when the app starts"],
    "answer": [0, 1],
    "multi": true,
    "expl": "Constraints say how, never what gets made, and the first two only forbid things. The last two each produce something visible, so each earns a table row."
  },
  {
    "q": "An output cell in your table reads: \"a sorted list and a page count.\" Which check just failed?",
    "options": ["Check one: every verb in the text has a row", "Check two: each row has exactly one output", "Check three: no undefined word is left over", "Check four: constraints live on their own list"],
    "answer": 1,
    "expl": "An \"and\" in an output cell means one row is doing two jobs, so split it. A missing verb would show as no row at all, not as a crowded cell."
  },
  {
    "q": "You have a full table but cannot say the plan in three sentences. What is the most likely reason?",
    "options": ["You need more practice speaking under pressure", "The statement is too large for a single plan", "Two rows depend on something still undecided", "The table has too many rows and needs trimming"],
    "answer": 2,
    "expl": "Three sentences fail when the chain is not joined up yet, usually because one row's input is still unknown. It is a thinking gap, not a speaking problem, and finding it is the point of the check."
  },
  {
    "q": "In the typewriter app, which pieces of code enforce \"starts only after the flag loads, and runs once\"? Select all that apply.",
    "options": ["The early return while the flag is still null", "The clearInterval call in the effect cleanup", "The empty dependency list on the fetch effect", "The trim call on the fetched response text"],
    "answer": [0, 1],
    "multi": true,
    "expl": "The early return delays the timer until the flag exists, and the cleanup stops a double mount from running two timers. The empty list only controls the fetch, and trim just tidies the string."
  },
  {
    "q": "You are 45 minutes into a 50-minute round and realise a requirement was never built. Which habit would most likely have caught it?",
    "options": ["Ticking table rows as each one is finished", "Writing the code in smaller, separate files", "Reading the statement again from memory", "Adding a notes column to the dissection table"],
    "answer": 0,
    "expl": "An unticked row is a visible, missing requirement long before the end. Re-reading from memory is exactly what drifts, and a notes column turns the table back into prose."
  }
]
```

```related
[
  {
    "title": "Debounce",
    "url": "https://www.greatfrontend.com/questions/javascript/debounce",
    "source": "GreatFrontEnd",
    "kind": "practice",
    "difficulty": "Medium",
    "note": "A short spec to dissect: four verbs, four lines of code."
  },
  {
    "title": "You might not need an effect",
    "url": "https://react.dev/learn/you-might-not-need-an-effect",
    "source": "react.dev",
    "kind": "read",
    "note": "When a row belongs in an effect, and when it is just derived during render."
  },
  {
    "title": "Choosing the state structure",
    "url": "https://react.dev/learn/choosing-the-state-structure",
    "source": "react.dev",
    "kind": "read",
    "note": "Turning your table's state column into the smallest state that works."
  }
]
```
