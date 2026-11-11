---
type: explanation
title: How we build
description: "The human's theory of how software is built here: what humans decide, what agents do, and what simplicity means in this architecture."
related: [coding/coding-rules.md, code-review/the-review.md, /documentation-system/docs/the-theory.md]
nav: { order: 10 }
---

# How we build

Humans stop checking code for bugs and stop testing it. We abstract ourselves to system design, alignment with the future architecture, decision making and the robustness of architectural flows: anything high level. Functions, code and coding style are not ours anymore. Everything below that line is the agents', at the best quality possible, and the [coding rules](coding/coding-rules.md) are what that quality is held against. How that line is checked is [code review](code-review/the-review.md).

## Simplicity, in every axis

Simplicity matters most in the abstract ideas, because they survive the longest. Less parts and more solid ideas that can expand is far better than anything.

Duplication is ten times better while agents work, even where it looks ugly. Similarity in implementation does not mean it is the same idea; perhaps it is coincidence, perhaps it is temporary. Only a human can judge sameness, so reuse is a suggestion to the human, never something an agent does on its own.

Fixing each edge case as it comes multiplies execution flows and makes the whole hard to test, maintain and understand. Humans make good trade-offs here, and an agent's job is to remind them of the trade-off, not to take it.

Fewer moving parts, fewer combinations of possible integrations.

Patterns are reused, not code: a new scope does a thing the way an existing scope already does it before inventing its own way.

## Modularity

Code follows the same modularity ideas the [docs system](/documentation-system/docs/the-theory.md#scopes-not-levels) holds for knowledge: colocation, encapsulation, one dependency direction. One idea for both, not one for code and another for docs. The rules: [modularity](coding/coding-rules.md#modularity) and [the boundary](coding/coding-rules.md#the-boundary).

## Debuggable, traceable, runnable here

Code needs to be debuggable, runnable locally, and trackable with enough logs to every detail. Local is the full environment as much as possible, so every run that needs external access has to justify the reason. What a reasonable log is, agents work out from what the codebase already established; the rules say only where a line must exist.

## What an agent reminds, not decides

Architecture, decisions and the trade-offs above are the human's. An agent that meets one, a new path, a new part, an abstraction, a branch per edge case, a crossing of a boundary, names it and asks the question a senior architect would ask. It does not decide, and it does not put its own theory in the human's mouth.
