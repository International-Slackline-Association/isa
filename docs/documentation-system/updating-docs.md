---
type: how-to
title: Updating docs
description: >-
  How a scope's docs change: the five ways a change starts, what is written and asked at the end of every change, then the steps for a README, an explanation or policy, a reference or how-to, and the review that closes every one.
nav:
  order: 60
---

# Updating docs

Why: [the why comes from the conversation](the-theory.md#the-why-comes-from-the-conversation). Rules: [folder convention](folder-convention.md), [frontmatter spec](frontmatter-spec.md), [content rules](content-rules.md). Skeletons: [templates](templates.md).

The best way anything gets documented is the human sharing the why as the work goes and answering the agent's questions. The agent finds the seams in the code, the human supplies what the code cannot show, the agent writes it down in their words at the end of the change. Every path below ends there; none of them ends with the agent writing a why nobody gave it. Every question to the human goes through the AskUserQuestion tool, one at a time: they answer by choosing, not by typing into a wall of text.

## How a change starts

Every change to a `docs/` folder starts in one of five ways. Nothing else starts one.

1. **The human writes it themselves.**
2. **The human asks**, for a doc, a sentence, a scope converted, or "record that" about something they said in conversation. The steps below. A specific edit is exactly that edit; do not "improve" the text around it. "Note it" is one line in the scope's `docs/notes.md`, in their words.
3. **[The end of a change](#at-the-end-of-a-change)**: the agent writes what the conversation gave and asks for what its change needs and the conversation did not give.
4. **A fact is false, or a claim became derivable, duplicated or residue**, in any doc, explanations included. Correct a fact the code shows false to what is now true, or delete it. A reference or how-to the change left incomplete is false the same way: add the row or the step. Delete a claim that became derivable, duplicated or residue, and a doc that fails [the document test](content-rules.md#the-document); a whole reference or how-to is never deleted this way, only by the human. A why that became false is deleted or cut to the true fact, never rewritten into a new why; if the doc then lacks a why it needs, ask. Of two docs that contradict each other, fix the one the code shows false; ask only when the code cannot tell. Say in your report or pull request what you fixed or deleted.
5. **[The adversarial reader](the-theory.md#the-adversarial-reader) is sure a rule is broken.** It removes the breach itself. What it is unsure of it reports; its questions the caller brings to the human and writes the answers (3), and the rest the human turns into 1 or 2 if it was worth it.

## At the end of a change

Runs at the end of every change, before the pull request; nothing waits for the human to ask for it.

1. Walk the change by scope, lowest folder first.
2. For each scope, write what the human said in this session that the code will not show: what they decided, what they considered and rejected, what is not decided, what the next change must not foreclose. In their words, through [an explanation or policy](#an-explanation-or-policy).
3. Where the change holds a decision the conversation did not explain ([how we build](/docs/engineering/how-we-build.md#what-an-agent-reminds-not-decides)), ask, one question at a time and anchored to the diff. "Nothing" is a complete answer: the scope needs no doc, and the absence says so. A mechanical change holds none: write nothing and say so in one line.
4. A sentence in an existing doc that the change falsified is way 4.

## Before any doc

1. `find-in-docs <topic>`. If a doc owns the topic, change it.
2. Pick the scope: the lowest folder that contains everything the doc is about.
3. Pick one type by the filing test in the frontmatter spec.
4. Frontmatter: `type`, `description`, optionally `title`. Spend the effort on the description.
5. Give the siblings `nav.order` in the README's reading order.
6. If the scope has no `docs/README.md`, create it and its `CLAUDE.md` from [templates](templates.md), with its links; the orientation lines are the human's, ask for them if the session did not give them. If the README's reading order misses the doc, add the entry.

## A README

Follow the README rules in the [folder convention](folder-convention.md#the-readme); there are no further steps.

## An explanation or policy

This is where the human does the thinking the code cannot show, and the conversation and the questions are how they do it. Ask whenever an answer is neither in the code nor in the session, however small the request; never fill in for them.

1. What the conversation gave decides whether the scope needs one: if a competent agent entered this folder with no docs, what would it get wrong? Nothing → no `docs/`. One sentence → the README. More → a sibling explanation.
2. Ask what you cannot derive and the session did not give, one question at a time, each anchored to something you found in the code: "X depends on Y; I would have expected Z. Why?" Options are welcome; what goes into the doc is what they chose or corrected, never an option they did not. Stop when you can predict the human's decision in a new case, or when they say stop. Where the session already holds the answer, skip to 3, unless the why behind it is missing: ask for it.
3. Write only what they said and answered, in their words, and what they rejected, as [the theory](the-theory.md#derivable-or-theory) describes. In the scope where it is fully true ([folder convention](folder-convention.md#placement)). If an answer contradicts existing explanation, replace it: they changed their mind; don't leave both.
4. Apply the [content rules](content-rules.md) to every claim. Delete every derivable one. An answer you could have found in the code was never a gap: say which README or description should have pointed you there.
5. Read it as an agent would: could a reader predict what the human would decide in a new case here? If not, it is too vague: ask more. If they could predict it from the code alone, the doc is noise.

## A reference or how-to

1. Write only what is reconstructible from the code. No why, no should, no future. Pointers say *where* ground truth lives, never *what* it says.
2. Keep the altitude: if an ordinary code change would falsify a sentence, raise it or reduce it to a pointer.
3. A step names the action and the place that defines it; the invocation is the reader's. A command, a flag, a path or a payload is in only where a competent reader would not find it by looking, and then because it is the trap.
4. Stay under one screen (about 60 lines). Over → cut or split.
5. If a step's order or choice encodes judgment, the "because" is theory: link to the explanation, or ask the human for it.

## Review

1. Run [the adversarial review](adversarial-review.md) and carry on. What it reports, you and the human decide on.
2. Read the result as the next worker in the scope, not as the author: is anything here about your task rather than about the folder?
3. For each doc, write in your report what in it a worker could not have found by looking. If you cannot, the doc is derivable: delete it.
4. Check the type: one per file, content matches the filing test.
