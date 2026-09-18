---
name: learning-doc-builder
description: >-
  Write one ADHD-friendly interactive learning doc as a markdown file with a
  graded active-recall quiz appended, for the learning-doc-builder React app.
  Six to nine short sections, each with TL;DR / Steps / Nuances / Interview
  buckets, at most one real code snippet per section, an optional inline SVG
  diagram, a cheat-sheet table, and a 12-15 question scenario quiz with 2-3
  select-all items and an explanation on every answer, section recaps, a closing summary,
  captioned tables and images, a glossary the app turns into clickable
  underlined terms, and verified practice exercises and further reading. Use whenever the user
  wants a learning doc, explainer, reading guide, onboarding doc, study guide,
  or an "explain X" deliverable in this format / the same format / like those
  docs / in that style, or asks for a doc with a quiz, even without saying
  "skill". Triggers: "make a learning doc about X", "explain how X works as a
  reading guide", "build an onboarding explainer for X", "a guide for X with a
  quiz", "another one of those docs for X", "write a blog post in the doc
  format". Grounds in the local repo when the topic is a codebase.
---

# Learning doc builder

Produce ONE markdown file that teaches a technical topic to a reader with a short attention span, then validate it.

Output path:

- a learning doc -> `content/docs/<kebab-slug>.md`
- a blog post -> `content/blog/<kebab-slug>.md` (quiz optional)

You write markdown only.
Never write HTML, CSS, or a standalone page.
The app owns every visual decision: collapsible boxes, icons, code highlighting and copy buttons, the floating glossary, underlined terms, section dividers.

## Golden rule: research first, template last

A beautiful shell around wrong facts is worse than no doc.
Gather the substance before you open the template.
Never invent a file path, a PR number, a metric, a citation or a URL.
If something is unverified, write "unverified" in the doc.

## Workflow

1. **Lock the scope.** Ask at most one question, and only if the answer changes the doc: depth, angle, or audience.

2. **Ground it.**
   - Codebase topic: read the real code. Collect real paths, names and short real snippets.
   - General topic: work from knowledge or the web, and attribute claims to the study or spec they come from.
   - Keep a misconception list as you go. The quiz needs it.
   - Keep a jargon list as you go. The TERMS box needs it.

3. **Write the doc.** Follow `references/authoring-guide.md` exactly, starting from `assets/doc-template.md`.

4. **Write the quiz.** Read `references/quiz-rubric.md` first. Scenario questions in fresh situations, never a sentence lifted from the prose.

5. **Explore.** Read `references/explore-guide.md`. Search for hands-on practice (GreatFrontEnd, official tutorials) and the best further reading, open every URL to confirm it is live and on-topic, and write the `related` block.

6. **Validate.** Run `pnpm check:content` and fix everything it reports.

7. **Look at it.** Run `pnpm dev`, open the doc at 375px and at desktop width, in both themes. Click a few underlined terms and the floating book button.

## Hard rules

- Voice: a patient teacher explaining to one student with ADHD. Problem first, then the fix.
- **One sentence per line.** Source lines render as separate lines, so a new line is a new thought. Keep two sentences on one line only when the second cannot stand alone.
- Open the doc with one `> [!TERMS]` box. Every term in it becomes a clickable underline in the text, and the box itself moves to the floating button. Still define each term in plain words the first time it appears.
- 6 to 9 `## ` sections. The first is the big picture and leads with a table or a diagram.
- **Every section ends with a `> [!RECAP]` box** of two or three points to remember.
- **The doc ends with `## Summary`** holding one `> [!SUMMARY]` box of four or five points.
- **Every table has a `Table: how to read it` line** directly above it.
- **Every image has a caption** in simple words: `![alt text](path "Caption.")`.
- At most one code snippet per section, 5 to 15 lines, with a language tag.
- Exactly one `> [!GOTCHA]` per doc.
- The quiz block, then the related block, are the last things in the file, and both parse as JSON.
- No em dashes anywhere. Use a plain hyphen or a colon.

## Reference files

- `references/authoring-guide.md` - voice, section shape, boxes, tables, images, diagrams
- `references/quiz-rubric.md` - questions that measure understanding
- `references/explore-guide.md` - finding and verifying practice and reading links
- `assets/doc-template.md` - the skeleton to copy
