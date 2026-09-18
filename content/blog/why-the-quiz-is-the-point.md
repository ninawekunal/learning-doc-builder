---
title: The quiz is the doc
summary: Notes on why every learning doc I write ends with a graded test, and what changed when I started measuring the score.
date: 2026-09-17
tags: [writing, learning]
minutes: 5
---

## The problem with a good explainer

I used to judge a technical doc by how it felt to read. Clear headings, a decent
diagram, no wall of prose. By that standard I wrote a lot of good docs, and then
could not answer questions about the systems they described.

The failure is specific. A well-written explainer is *easy to follow*, and
following is not the same as retrieving. You finish it feeling like you know the
material, because the author did the hard part - deciding what mattered, in what
order - and you got the result without doing any of it.

> [!GOTCHA]
> Fluency is the trap. The smoother a doc reads, the more confident you feel and
> the less you have actually retained. Ease of reading and durability of memory
> pull in opposite directions.

## What the quiz changed

Adding fifteen scenario questions to the end of each doc did two things I did
not expect.

The first is obvious in hindsight: it exposed how little I retained. My first
score on my own doc, written by me, a week earlier, was eleven out of fifteen.
That number is not flattering and it is the most useful signal the format
produces.

The second is that **writing the quiz changed how I write the doc**. You cannot
write a good application question about a section you only half understand. Every
time I got stuck writing a question, it was because the section underneath it was
vague. The quiz became the editor.

## Rules that make the questions work

> [!STEPS]
> 1. **Never lift a sentence.** If a question is answerable by recognising
>    phrasing from the doc, it tests reading, not understanding.
> 2. **Put it in a fresh scenario.** A bug to diagnose, a teammate's proposal to
>    push back on, a number to interpret.
> 3. **Make every distractor a real misconception.** The wrong answers should be
>    things a competent person actually believes.
> 4. **Equalise option lengths.** If the correct answer is always the longest,
>    you have built a test of test-taking.
> 5. **Explain both directions.** Why the right one is right, and why the most
>    tempting wrong one is wrong.

> [!NUANCE]
> Calibration matters more than difficulty. The target is a skimmer scoring
> around sixty percent and someone who understood scoring above ninety. If
> everyone scores high, the questions are testing recognition and the doc is
> lying to you about how well it worked.

## The part I did not plan

Once the score existed, spacing became free. A doc with a recorded score and a
date is a scheduling signal: the ones I scored badly on are the ones worth
reopening in two weeks. Without the number I would have reread whichever doc I
happened to remember, which is the opposite of what the evidence recommends.

That is the whole system. Write the doc, write the test, take the test, record
the number, come back to the low ones.
