---
type: policy
title: Agent essential knowledge
description: >-
  What every session holds about the docs system: the idea, the map, and what
  must never happen. Imported by root CLAUDE.md.
---
# Documentation System 

This system is IMPORTANT beyond we can express. Everything relies on this foundation. Our documentation in this repo and the system around is the essential layer for everything. You must work with it fully!

You can read it all details starting at [the system's README](README.md) but here is the compact information you need to know for everything you work on. 

## Understanding documentation system

Docs hold only what the code cannot show: the why, what matters, where it is heading, what was rejected. Everything else you derive by looking. An explanation is the human's theory, not yours: you work inside it, at its edge you ask, and what they tell you in the session you write down at the end of the change, in their words.

Quick look for you:

1. [The theory of this system](the-theory.md): everything else follows from it; read once
2. [Content rules](content-rules.md): what goes into a doc and what stays out, skills and agent instructions included
3. [Folder convention](folder-convention.md): where a doc lives, what a README holds, how docs link
4. [Frontmatter spec](frontmatter-spec.md): the fields, the six types, what makes a doc findable
5. [Reading docs](reading-docs.md): how you find what you need during a task, and what to do when the docs are missing, legacy or wrong
6. [Updating docs](updating-docs.md): how a change starts and the steps for each type, ending in the review; skeletons in [templates](templates.md)

## Finding docs

The docs are spread across the repo next to the code they describe, in `docs/` folders. Before you guess where knowledge is, when you enter a scope, or meet a term you don't know: start at the scope's `docs/README.md` and run the `find-in-docs` skill, which lists every doc with its type and description.

## Never

- Never write into a doc what a competent worker can reconstruct from the code. Agents write too much; when in doubt, cut.
- Never restate higher-scope knowledge. Link to it.
- Never write a why the human did not give you, in this session or on being asked, and never leave one they did give you in the chat or ask whether to record it: write it [at the end of the change](updating-docs.md#at-the-end-of-a-change). Fixing a fact the code shows false and deleting what became derivable, duplicated or residue need no asking, in any doc: do both, and name each in your report; a false why is deleted or cut to the true fact, never rewritten. A reference or how-to you keep true; adding or removing one is the human's. Before touching any doc, read the system in full through the `update-docs` skill.
- Never proceed past a sentence saying something is undecided, build toward or foreclose a future the docs only mention, fill a missing why with a plausible guess (in docs or in code comments), or settle a contradiction the code cannot settle. Ask, or flag.
- Never work around a policy that forbids what the task requires, or set aside a rationale you disagree with: say so before acting, then follow it unless told otherwise.
- Never answer from a description or a README line: descriptions and the README only point. Open the file.
