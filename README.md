# learning-doc-builder

A format, a React app, and a Claude skill for turning a topic into **one
interactive page**: short sections, real code, a graded active-recall quiz, dark
mode, bionic reading, and a mobile layout that collapses the whole doc into one
sticky dropdown.

Built for a reader with a short attention span. Every structural choice maps to
something from the retrieval-practice literature rather than to taste.

> Live site: `https://ninawekunal.github.io/learning-doc-builder/`

---

## What is in here

| Path | What it is |
| --- | --- |
| `skill/learning-doc-builder/` | The Claude skill. Copy it into your own setup. |
| `content/docs/*.md` | Learning docs. One markdown file each, quiz included. |
| `content/blog/*.md` | Blog posts. Same renderer, quiz optional. |
| `src/` | The React app that renders them. |
| `scripts/check-content.mjs` | The validator that gates CI. |

The skill writes markdown. The app owns every visual decision. Changing how all
of your docs look is one stylesheet, not forty files.

---

## Reading features

- **Dark mode** - set before first paint from `localStorage`, so no light flash.
- **Bionic reading** - a bold fixation prefix on every word, toggleable. Code
  blocks are left alone.
- **Reading width** - three steps, because 72ch is not right for everyone.
- **Mobile section dropdown** - on a phone the table of contents becomes one
  sticky bar showing the section you are in; tap it for the full list.
- **Graded quiz** - one question at a time, instant feedback with an
  explanation, a score ring at the end, and a copyable result line.

All four preferences persist per browser and degrade safely when storage is
blocked.

---

## Quick start

```bash
pnpm install
pnpm dev
```

Then:

| Command | What it does |
| --- | --- |
| `pnpm dev` | Local dev server |
| `pnpm build` | Production build into `dist/` |
| `pnpm check:content` | Validates front matter, quiz JSON, and house rules |
| `pnpm typecheck` | `tsc -b` |
| `pnpm lint` | ESLint |

---

## Using the skill

### 1. Install it

```bash
cp -R skill/learning-doc-builder ~/.claude/skills/
```

Anything that reads Claude skill folders works: Claude Code globally
(`~/.claude/skills/`), a single repo (`.claude/skills/`), or your own agent
setup. The folder is self-contained - a `SKILL.md`, two reference files, and a
template.

### 2. Ask for a doc

```text
Make a learning doc about how HTTP caching headers work.
```

The skill:

1. Locks the scope, asking at most one question and only if it changes the doc.
2. **Researches before templating.** For a codebase topic it reads your real
   files and cites real paths. A beautiful shell around wrong facts is worse
   than no doc.
3. Writes 6 to 9 short sections, each with TL;DR / Steps / Nuances / Interview
   buckets, at most one code snippet, and an optional inline SVG diagram.
4. Writes a 12 to 15 question quiz of **scenario** questions, 2 to 3 of them
   select-all, each with an explanation covering why the right answer is right
   and why the tempting wrong one is wrong.
5. Runs `pnpm check:content` and fixes what it flags.

Output lands in `content/docs/<slug>.md` and appears in the app on save.

### 3. Write one by hand

Front matter, prose, then one fenced `quiz` block at the end.

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

> [!GOTCHA]
> The one trap that costs people hours.

```quiz
[
  {
    "q": "A response carries private, max-age=600 and no Vary header...",
    "options": ["...", "...", "...", "..."],
    "answer": 2,
    "expl": "Why the right one is right, and why the tempting wrong one is wrong."
  }
]
```
````

Callouts available: `TLDR`, `STEPS`, `NUANCE`, `INTERVIEW`, `GOTCHA`, `WIN`.

---

## The quiz rules that matter

Most docs with quizzes fail here. The full rubric is in
`skill/learning-doc-builder/references/quiz-rubric.md`; the short version:

- **Never lift a sentence from the doc.** If recognising phrasing answers the
  question, you tested reading, not understanding.
- **Every question is a fresh scenario** - a bug to diagnose, a proposal to push
  back on, a number to interpret.
- **Every distractor is a real misconception**, not a filler option.
- **Option lengths within about three words of each other.** If the correct
  answer is always the longest, you built a test of test-taking.
- **Calibrate so a skimmer scores around 60 percent** and someone who understood
  scores above 90. If everyone scores high, it is measuring recognition.

`pnpm check:content` enforces the mechanical half of this and warns on the rest.

---

## Deploying to GitHub Pages

1. Repository settings, Pages, **Source: GitHub Actions**.
2. `vite.config.ts` sets `base` to `/learning-doc-builder/`. Change it if your
   repo is named differently, or set `VITE_BASE=/` for a custom domain or a
   `<user>.github.io` repo.
3. Push to `main`. `.github/workflows/deploy.yml` validates, builds and deploys.

Routing uses a hash router deliberately: `/#/docs/some-slug` deep-links
correctly on Pages with no 404 rewrite and no server configuration.

---

## Why the format looks like this

| Feature | The mechanism behind it |
| --- | --- |
| Four buckets per section | Chunking, so a section stays re-retrievable |
| Interview must-know bullets | Pre-formed retrieval cues to self-test on |
| Scenario quiz | Retrieval practice, which beats review on delayed tests |
| Select-all questions | Forces discrimination instead of pattern matching |
| Explanation after each answer | Feedback, which is what rescues a failed attempt |
| Copyable score | A record to space your next review against |

`content/docs/active-recall.md` is the long version, with the citations.

---

## License

MIT. The skill, the app and the format are free to copy and change.
