---
title: Use the skill
summary: Install the learning-doc-builder skill, point it at a topic, and get an easy-to-read doc with a graded quiz and practice links.
date: 2026-09-18
tags: [skill, workflow]
---

## What the skill does

> [!TLDR]
> `learning-doc-builder` is a Claude skill.
> You give it a topic; it researches it, writes one markdown file into `content/docs/`, and adds a graded quiz and practice links.
> The React app in this repo turns that file into the page you are reading.

The skill writes **one markdown file in a fixed shape**.
It never writes HTML or CSS.
Everything visual lives in the app: dark mode, bionic reading, the mobile section bar, collapsible boxes, code highlighting, the underlined glossary words and the quiz.
So changing how every doc looks is a change in one place.

> [!RECAP]
> - The skill writes markdown; the app does all the visuals.
> - One file per doc, in a fixed shape.

## Install it

Copy the skill folder into whichever skill directory your setup reads.

```bash
# Claude Code, available in every project
cp -R skill/learning-doc-builder ~/.claude/skills/

# or only for one repo
cp -R skill/learning-doc-builder .claude/skills/
```

Then ask for "a learning doc about X".
The skill should trigger without you naming it.

> [!NUANCE]
> The skill's `description` is what makes it fire on plain requests.
> If you rename the folder, keep the description, or the trigger phrases stop working.

> [!RECAP]
> - Copy one folder into your skills directory.
> - Plain requests like "make a learning doc about X" trigger it.

## Generate a doc

```text
Make a learning doc about how HTTP caching headers work.
```

> [!STEPS]
> 1. **Lock the scope.** At most one question, and only if the answer changes the doc.
> 2. **Research first.** Real code and real sources before any writing.
> 3. **Write the doc** in the teacher voice, in the shape below.
> 4. **Write the quiz.** Scenario questions, never sentences copied from the doc.
> 5. **Explore.** Search for practice exercises and further reading, open every link to check it, and add the good ones.
> 6. **Validate.** `pnpm check:content` must pass.

> [!RECAP]
> - Research, write, quiz, explore, validate - in that order.
> - Every practice link is opened and checked before it goes in.

## The shape of a doc

Front matter, sections, a summary, then two fenced JSON blocks: the quiz and the related links.

````markdown
---
title: How HTTP caching works
summary: One line that tells someone whether to read this.
date: 2026-09-18
tags: [http, caching]
minutes: 12
---

## The big picture

> [!TERMS]
> - **Cache** - a stored copy of an answer, so you do not have to ask again.

> [!TLDR]
> One or two sentences.

Table: each row is a header and what it tells the browser.

| Header | Meaning |
| --- | --- |

![Alt text for screen readers](images/cache-flow.png "A plain-English caption under the image.")

> [!RECAP]
> - The one thing to remember from this section.

## Summary

> [!SUMMARY]
> - The key points of the whole doc.

```quiz
[{ "q": "...", "options": ["a", "b", "c", "d"], "answer": 2, "expl": "..." }]
```

```related
[{ "title": "...", "url": "https://...", "source": "MDN", "kind": "read", "note": "Why it is worth your time." }]
```
````

Every section ends with a **Remember** box, and the doc ends with a **Summary** section.
The checker fails a doc that is missing either.

> [!RECAP]
> - Sections end with a RECAP box; the doc ends with a Summary.
> - Tables need a `Table:` line and images need a caption.

## Boxes you can use

Table: each row is a box type, how it looks, and when to use it.

| Marker | Looks like | Use it for |
| --- | --- | --- |
| `> [!TERMS]` | The floating book button, bottom right | Plain definitions; every mention in the text gets a dotted underline you can click |
| `> [!TLDR]` | Purple, sparkle icon | The one or two sentences someone in a hurry needs |
| `> [!ANALOGY]` | Amber, light bulb | An everyday comparison for a big idea |
| `> [!STEPS]` | Blue, numbered list icon | An ordered procedure, 3 to 7 steps |
| `> [!NUANCE]` | Grey, scales icon | Trade-offs and edge cases |
| `> [!INTERVIEW]` | Amber, speech bubbles | The question someone will ask, and the short answer |
| `> [!GOTCHA]` | Red, warning triangle | The one trap per doc that costs people hours |
| `> [!WIN]` | Green, trophy | The measured outcome |
| `> [!RECAP]` | Pin | Key points at the end of every section |
| `> [!SUMMARY]` | Green, clipboard | The whole doc's key points, in the Summary section |

Every box can be collapsed.
Code blocks are collapsible too, and have a copy button.

> [!RECAP]
> - Ten box types, each with its own colour and icon.
> - Glossary words become clickable underlines across the doc.

## Writing so it is easy to read

> [!STEPS]
> 1. **One sentence per line.** Each line shows on its own line, so a new thought starts on a new line. Keep two sentences on one line only when the second cannot stand alone.
> 2. **Define every term in the TERMS box**, and in plain words the first time it appears.
> 3. **Problem first, then the fix.** Say what goes wrong before explaining the solution.
> 4. **Caption everything.** Every image gets a caption in simple words; every table gets a "how to read this table" line.
> 5. **End every section with a recap** of two or three points, and the doc with a summary.

> [!RECAP]
> - Short lines, plain words, problem before fix.
> - Recaps and captions everywhere.

## Publish it

> [!STEPS]
> 1. **Turn on Pages.** Repository settings, Pages, Source set to GitHub Actions.
> 2. **Set the base path.** `vite.config.ts` defaults to `/learning-doc-builder/`. Change it if your repo has a different name.
> 3. **Push to main.** The workflow checks the content, builds the site and deploys it.

The app uses a hash router, so a deep link like `/#/docs/http-caching` works on GitHub Pages with no server setup.

> [!RECAP]
> - Turn on Pages, check the base path, push.

## Summary

> [!SUMMARY]
> - The skill writes one markdown file; the app handles every visual.
> - Each doc has a words box, recaps, a summary, a quiz and checked practice links.
> - `pnpm check:content` enforces the rules before anything ships.
