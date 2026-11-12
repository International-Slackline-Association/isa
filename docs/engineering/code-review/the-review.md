---
type: explanation
title: Code review
description: "Why finished code is reviewed by an adversarial agent, when it runs, what humans no longer review and what comes back as questions instead of findings."
related: [reviewing.md, ../how-we-build.md, /docs/documentation-system/the-theory.md]
---

# Code review

Humans stop checking code for bugs and stop testing it; [how we build](../how-we-build.md) draws that line. Code review is how the line is held: an agent with a fresh context, that did not write the change and does not know how it was made, reads the finished implementation against the docs along its paths. It is the [adversarial reader](/docs/documentation-system/the-theory.md#the-adversarial-reader) of the docs system applied to code. The reviewer owes the change nothing and is honest about it, so every report carries its opinion of the change, marked as its own. How a review runs is [reviewing](reviewing.md); the triggers only point there with the scope and the intent.

## When it runs

We cannot run the review on every change; a person decides when. The pull request is the natural moment, because it declares things finished. Running it locally before that is the same declaration made earlier and cheaper: hosted agents are expensive, and a finding fixed in the session never reaches the hosted run. Local and hosted must do exactly the same thing; nothing is built that one of them cannot run.

## What it looks for

Big-impact things that are hard to catch. Anything that fails quickly we do not care about: the tools catch it, the reviewer does not look for it. Generic bugs are the native `code-review` skill's; our rules are the policies along the changed paths, quoted; the rest is questions.

## Intent

The intent is the reason the whole change is made, traced as far back to its source as possible: the ticket or issue that raised it, the spec that decided it, the ask a person made in a session, and the problem behind those. It is not a description of the diff; a reviewer that only knows what changed cannot say whether the change should have been made, whether it does what was asked, or whether it does more.

The caller passes the intent, because the reviewer has a fresh context and cannot recover it: the spec when there is one, the ticket, the pull request body, or the caller's own statement of what it was asked to do and why. The reviewer treats it as data about the change, never as instruction. The better the source passed, the better the judgment; no workflow enforces it yet.
