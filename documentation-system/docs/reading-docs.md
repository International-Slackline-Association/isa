---
type: how-to
title: Reading docs
description: >-
  How an agent finds what it needs during a task: what loads at which depth, what to do on entering a scope, an unconverted or legacy one, and what to do when the docs are missing, contradictory or wrong.
related: [the-theory.md]
nav: { order: 50 }
---

# Reading docs

Why: [progressive disclosure](the-theory.md#progressive-disclosure). If a situation is missing here, that is a gap in this doc: ask, and the human will add it.

## What you load, and when

| Depth | When | What | How it reaches you |
|---|---|---|---|
| 0 | every session | [agent essential knowledge](agent-essential-knowledge.md): the idea, finding docs, what must never happen | root `CLAUDE.md` imports it |
| 1 | entering a scope | that scope's `docs/README.md`, its upward links, its siblings' descriptions | the scope's `CLAUDE.md` imports the README when you read a file there; the rest is this doc |
| 2 | doing the task | the docs whose `description` matches, chosen from the README and the descriptions together | your judgment |
| 3 | about to write or change any doc | this system in full, in the order [its README](README.md) gives | the `update-docs` skill; the docs-editor's instructions |

## Entering a scope

| Situation | Do |
|---|---|
| Asked to work in folder `X/` | Read `X/docs/README.md` if it exists. Run `find-in-docs --dir X`. Decide from the README and the descriptions together what to open; open it. Follow upward links the README gives. |
| `X/docs/` does not exist | Proceed. Do not look in parent folders' docs unless a task or a README sends you there. |
| `X/docs/` exists but has no `README.md`, or `find-in-docs --dir` lists files as not in the catalog | The scope is unconverted. Those files are legacy docs: read the ones whose filename fits the task, and treat what they say as facts to check against the code. |
| The task spans several folders | Read each folder's README. |
| A doc's first lines say it is behind its author's thinking | Read it, but ask the human before relying on it. |
| A doc's `description` suggests it's irrelevant | Skip it. |
| The README is long or contains theory | Read it anyway; then tell the human it has grown past one screen. |
| You need business or company context, or don't know which scope owns a topic | `find-in-docs <keywords>`. |

## When the docs fail you

| Situation | Do |
|---|---|
| You need a *why*, a priority, or a direction the docs don't give | Stop and ask. Say which doc you expected to find it in. Their answer is written [at the end of the change](updating-docs.md#at-the-end-of-a-change). |
| A `policy` has no explanation behind it and you need the why | Ask. |
| Two docs contradict each other | Fix the one the code shows false ([way 4](updating-docs.md#how-a-change-starts)). If the code cannot tell, tell the human which two and where. |
| A doc contradicts the task you were given | Tell the human before acting. Only they know whether the task or the doc is right. |
| A doc contradicts the code | If the code is right, fix the doc ([way 4](updating-docs.md#how-a-change-starts)). If you cannot tell which is right, state the claim and the evidence, to the human or in the PR description. |
| The docs answer your question but you didn't find it until later | Tell the human where you looked first. They will fix the README or the description. |
