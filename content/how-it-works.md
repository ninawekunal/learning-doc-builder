---
title: Use the skill
summary: Install the learning-doc-builder skill, point it at a topic, and get a doc with a graded quiz in this repo.
date: 2026-09-17
tags: [skill, workflow]
---

## What the skill does

> [!TLDR]
> `learning-doc-builder` is a Claude skill. You give it a topic; it researches
> the topic, writes one markdown file into `content/docs/`, and appends a graded
> quiz to it. The React app in this repo renders that file.

The skill does not write HTML and it does not write CSS. It writes **one markdown
file in a fixed shape**. Everything visual - dark mode, bionic reading, the mobile
section dropdown, the quiz engine - lives in the app, so changing the look of every
doc you have ever written is a change in one stylesheet.

## Install it

Copy the skill folder into whichever skill directory your setup reads.

```bash
# Claude Code, available in every project
cp -R skill/learning-doc-builder ~/.claude/skills/

# or scoped to one repo
cp -R skill/learning-doc-builder .claude/skills/
```

Then confirm Claude can see it. In a session, `/learning-doc-builder` should
resolve, and asking for "a learning doc about X" should trigger it without you
naming it.

> [!NUANCE]
> The skill's `description` field is what makes it fire on plain requests like
> "explain how X works as a reading guide". If you rename the folder, keep the
> description intact or the trigger phrases stop working.

## Generate a doc

Ask in plain language. The skill handles the rest.

```text
Make a learning doc about how HTTP caching headers work.
```

What it does, in order:

> [!STEPS]
> 1. **Locks the scope.** It asks at most one question, and only if the answer
>    changes the doc. Depth and angle, never trivia.
> 2. **Researches before templating.** For a codebase topic it reads your actual
>    files and cites real paths. For a general topic it works from knowledge or
>    the web. A beautiful shell around wrong facts is worse than no doc.
> 3. **Writes the markdown.** Six to nine `##` sections, each with the four
>    buckets: TL;DR, steps, nuances, interview must-know.
> 4. **Writes the quiz.** Scenario questions in fresh situations, never a
>    sentence lifted from the doc. Two or three are select-all.
> 5. **Validates.** Runs `pnpm check:content`, which fails on a malformed quiz,
>    a missing front matter field, or an answer index out of range.

The output lands at `content/docs/<slug>.md` and shows up in the app on save.

## The file shape

Front matter, prose, then one fenced `quiz` block at the very end.

````markdown
---
title: How HTTP caching works
summary: One line that tells someone whether to read this.
date: 2026-09-17
tags: [http, caching]
minutes: 12
---

## The big picture

> [!TLDR]
> One or two sentences. Never three.

Prose, a table, or a diagram.

```quiz
[{ "q": "...", "options": ["a","b","c","d"], "answer": 2, "expl": "..." }]
```
````

> [!GOTCHA]
> The quiz block must be the last thing in the file and must parse as JSON. The
> content checker strips it before rendering, so a broken block does not blank
> your doc - it just silently disappears. Run the checker.

## Callouts you can use

| Marker | Renders as | Use it for |
| --- | --- | --- |
| `> [!TLDR]` | Plum box | The one sentence someone in a hurry needs |
| `> [!STEPS]` | Blue box | An ordered procedure, 3 to 7 steps |
| `> [!NUANCE]` | Grey box | Tradeoffs, rejected options, edge cases |
| `> [!INTERVIEW]` | Amber box | The question someone will ask and the one-line answer |
| `> [!GOTCHA]` | Red box | The one trap per doc that costs people hours |
| `> [!WIN]` | Green box | The measured outcome |

## Publish it

The repo deploys to GitHub Pages on every push to `main`.

> [!STEPS]
> 1. **Enable Pages.** Repository settings, Pages, Source set to GitHub Actions.
> 2. **Set the base path.** `vite.config.ts` defaults to `/learning-doc-builder/`.
>    Change it if your repo has a different name, or set `VITE_BASE=/` for a
>    custom domain.
> 3. **Push.** The workflow in `.github/workflows/deploy.yml` builds and deploys.

Routing uses a hash router on purpose: a deep link like
`/#/docs/http-caching` works on Pages with no 404 rewrite and no server config.

## Writing a blog post instead

Same shape, different folder. Drop the file in `content/blog/` and omit the quiz
block if the piece does not need one. The reading controls, theme and mobile
dropdown apply identically.
