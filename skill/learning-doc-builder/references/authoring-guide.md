# Authoring guide

Read this fully before writing.
The reader reads fast, skips walls of prose, and loses the thread if a section runs long.
Structure is what makes the doc usable, not decoration.

## Voice: a patient teacher, one student

Write as a teacher explaining the topic to one student with ADHD who is smart but new to it.
The reader should never have to stop and look a word up.

- **Problem first, then the fix.** "Here is what goes wrong. Here is why. Here is what we do instead."
- **Define every term the first time it appears**, in plain words, in the same sentence or the next.
- **Use one `> [!ANALOGY]` per big idea** - an everyday comparison that makes the mechanism click.
- **Name the feeling.** "This looks fine, and that is exactly the trap."
- Short sentences. Second person. Never stack two unexplained terms in one sentence.

## Line rhythm: one sentence per line

Every source line renders on its own line, with a little space above it.
Use that on purpose:

- Start a new line for each new sentence.
- Keep two sentences on one line only when the second makes no sense alone ("That is the whole idea. Nothing more.").
- Leave a blank line to start a new paragraph when the topic shifts.
- Never break a line in the middle of a sentence. The checker warns when you do.

## Front matter

```yaml
---
title: Sentence case, under 60 characters
summary: One line that tells someone whether to read this.
date: YYYY-MM-DD
tags: [three, or, four]
minutes: 12
part: 1                  # only for a series
series: Series name      # only for a series
---
```

## The words box (TERMS)

The first thing in the doc is one `> [!TERMS]` box with the 5 to 10 words the doc relies on.

```markdown
> [!TERMS]
> - **Row model** - the list of rows the table hands you after filtering, sorting and paging.
> - **BFF (backend for frontend)** - a small server between the browser and the real API.
```

The app does three things with it:

- The box is not shown inline. It becomes the floating book button at the bottom right.
- The first mention of each term in every section gets a dotted underline that opens its definition.
- Text in brackets counts as another name: "BFF (backend for frontend)" matches both.

Write each definition as one plain sentence a beginner understands.

## Sections

Six to nine `## ` sections, each under roughly 120 lines.
Section one is **The big picture** and leads with a table or a diagram.

Inside a section, use only the boxes that carry real content, in this order:

```markdown
> [!TLDR]
> One or two sentences. Never three.

Prose, one sentence per line.

> [!ANALOGY]
> An everyday comparison.

> [!STEPS]
> 1. **Do the thing.** One sentence on why.

> [!NUANCE]
> - A trade-off, an edge case, or a rejected option and why.

> [!INTERVIEW]
> - *The question someone will ask.* The short answer.

> [!RECAP]
> - The first thing to remember from this section.
> - The second.
```

**Every section ends with a `> [!RECAP]` box** of two or three points.
Once per doc: one `> [!GOTCHA]` (the trap that costs hours) and one `> [!WIN]` (the payoff).

## Summary

The last section is always:

```markdown
## Summary

> [!SUMMARY]
> - Four or five points that together cover the whole doc.
```

## Tables

Use a table wherever a comparison would otherwise become three paragraphs.
**Every table has a caption line directly above it** telling the reader how to read it:

```markdown
Table: each row is a header, and the right column says what it tells the browser.

| Header | What it tells the browser |
| --- | --- |
```

## Images

**Every image has a caption** in simple words, written as the markdown title:

```markdown
![Alt text for screen readers, precise](images/part/row-pipeline.png "The rows go through three steps in order: filter, sort, page.")
```

The alt text can be precise; the caption must be easy to read.

## Code

At most one snippet per section, 5 to 15 lines, always with a language tag (`tsx`, `ts`, `bash`, `css`, `json`).
The app highlights it and adds copy and collapse buttons.
If the code is real, say where it lives in the next line.

## Diagrams

Inline SVG with a `viewBox`, `role="img"` and an `aria-label`, using the CSS variables so it works in both themes: `--primary`, `--accent`, `--ok`, `--warn`, `--info`, `--text`, `--text-muted`, `--border`.
Keep it to boxes, arrows and labels.

## After the quiz

Close the file with the quiz block and then the `related` block described in `explore-guide.md`.

## Never

- Em dashes. Use a plain hyphen or a colon.
- A term used before it is defined.
- A table or image without a caption.
- A section without a recap.
