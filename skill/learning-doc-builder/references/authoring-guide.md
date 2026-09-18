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

## Size: 4 or 5 sections, then a series

An article has at most 5 `## ` sections before `## Summary` (the checker fails a sixth).
Aim for 4.
When a topic needs more, split it into articles that share `series:` and number them with `part:`.
Open part 2 onwards with one sentence that says what the previous part built and links it: `[Part 1](#/docs/<slug>)`.
End each part with one line that links the next.
The page header turns the series name into a dropdown of every part, so keep titles short and distinct (under about 55 characters).

## Folder

Each article is a feature folder:

```
content/docs/<slug>/
  index.md
  images/row-pipeline.png
  invoices.json          # optional downloads
```

Link everything relatively: `![alt](./images/row-pipeline.png "Caption.")`, `[the data](./invoices.json)`.

## Unlisted docs

Add `unlisted: true` to keep a doc off every list: the home page, the docs list, tags, and other docs' series menus.
It is still reachable by its URL, and it asks search engines not to index it.
Use it for anything company-specific, because listed docs must never name a company.

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

Four or five `## ` sections, each under roughly 120 lines.
Section one is **The big picture** and leads with a table or a diagram.
A section that is nice to have but not needed for what comes next is written `## Optional: ...`; it renders collapsed with an "Optional" badge. It still ends with a RECAP.

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
At most once per doc: one `> [!GOTCHA]` (the trap that costs hours) and one `> [!WIN]` (the payoff).

### Open or closed

Boxes that carry the main thread start open: TLDR, ANALOGY, STEPS, GOTCHA, THINK, RECAP, SUMMARY.
Boxes that carry depth start closed: NUANCE, INTERVIEW, WIN.
Override either way with a suffix: `> [!STEPS]-` starts closed, `> [!NUANCE]+` starts open.
Give a box its own label by writing it after the marker: `> [!NUANCE]- Worked answer: autocomplete`.
Rule of thumb: if the reader can skip it and still follow the next section, close it.

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
![Alt text for screen readers, precise](./images/row-pipeline.png "The rows go through three steps in order: filter, sort, page.")
```

The alt text can be precise; the caption must be easy to read.

## Code: think first, then peek

Every code block renders **collapsed** with its file name and line count, plus Copy (and Download when asked).
So the reader meets the problem before the answer.
Put a `> [!THINK]` box right before each substantial block:

```markdown
> [!THINK]
> The amount needs two fields, `amountCents` and `currency`.
> How can one column's cell reach the rest of the row?
```

One to three concrete questions, or the plan in plain words.
Never the answer itself.

Attributes go after the language, in the code fence's info string:

Table: each row is one code-block attribute and what the reader sees.

| Attribute | Effect |
| --- | --- |
| `title="columns.tsx"` | The file name in the header; use it for anything that is a file |
| `download="invoices.json"` | A Download button that saves the code under that name |
| `open` | Starts expanded; only for tiny snippets |
| `group="load" tab="React Query"` | Consecutive blocks with one group become one tabbed block; `tab` is the label |

Use tabs whenever you show two ways to do the same thing (client vs server, plain React vs a library).
Put the recommended way in the first tab.

Always tag the language (`tsx`, `ts`, `bash`, `css`, `json`).
If the code is real, say where it lives in the next line.

## Walkthroughs

For "how do I build X" topics, teach with a walkthrough:

1. Give the reader data first: a small, realistic JSON file, titled and downloadable.
2. Build in steps, one section each, from the plainest version (what an interviewer expects with no libraries) to the library version.
3. Each step: TLDR, THINK, the code, what just got better, RECAP.
4. Styling and polish go last, in an `## Optional:` section.

## Diagrams

Inline SVG with a `viewBox`, `role="img"` and an `aria-label`, using the CSS variables so it works in both themes: `--primary`, `--accent`, `--ok`, `--warn`, `--info`, `--text`, `--text-muted`, `--border`.
Keep it to boxes, arrows and labels.

## After the quiz

Close the file with the quiz block and then the `related` block described in `explore-guide.md`.

## Never

- More than 5 sections before the Summary.
- Code without a THINK box before it, when the code is the point of the section.
- Em dashes. Use a plain hyphen or a colon.
- A term used before it is defined.
- A table or image without a caption.
- A section without a recap.
