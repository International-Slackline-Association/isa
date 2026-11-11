---
type: how-to
title: Adversarial review
description: >-
  How a review of changed docs runs. The one-sentence call, existence before
  mechanics, the code opened for every document, the bounds on truth and
  questions, and what comes back.
related: [the-theory.md, content-rules.md, updating-docs.md]
nav: { order: 70 }
---

# Adversarial review

Why there is one, and what it must be: [the adversarial reader](the-theory.md#the-adversarial-reader), called the reviewer below. This is how a review runs. Today the reviewer is the `docs-review` agent.

## Calling it

1. A human, or an agent finishing a task, runs the reviewer. Pass one sentence naming a scope: this branch entirely, this commit, this folder. **Never paths, never the task, never why anything changed.** Every word beyond the scope is context the reviewer must not have.
2. Run it in the background and carry on. Nothing waits on it; the report comes back when it is done.

## The order of work

Existence first, mechanics last. The cheap checks are the ones a reviewer drifts to, and they are the least of the job.

1. Read the whole documentation system. Work out which files the scope covers. Documentation is any text: markdown, comments in code, skill and agent files. Code quality and bugs are not the reviewer's.
2. Every document: does it pass [the document test](content-rules.md#the-document)? Decided with the scope's code open, never from the text alone.
3. Every claim in what survives: [the content rules](content-rules.md), per claim, each fact checked against the code it describes.
4. Last: links, frontmatter, comment narration.

**Every file, every block, every claim in the scope gets a verdict.** Nothing is sampled and nothing is skipped. A comment is judged sentence by sentence, and mixed is not a verdict: each sentence is kept or cut on its own.

## The code is opened for every document

Derivability is decided against the code, never against the text. For every document the reviewer opens what the doc describes: the scope's files and what they directly reference, one hop, and stops there. What that read reconstructs is derivable. What it could not reach by looking is the doc's content, [rule 1](content-rules.md#the-rules).

Subagents are welcome for the reading, on the cheapest model that reads code well, as many as the scope has parts. Hand them code, never docs. The judgment on every document stays with the one reviewer; a reviewer holding one slice of the docs can only find nits.

**Cost is not the reviewer's concern.** A review that stopped short to save budget is worth less than none, because a scope called clean is a scope nobody looks at again. Do a deep, critical and good work.

## The pen, and the bounds

- The pen removes and moves words. **It never adds a sentence.** Deleting, trimming to a clause, correcting a fact in any doc, choosing which of two copies survives: all the reviewer's. Writing a sentence that was not there, a new why included: the session that holds the conversation, or the human.
- A whole `reference` or `how-to` is reported, never deleted: whether one exists is the human's ([why](the-theory.md#derivable-or-theory)).
- A why written by another session is trusted. The reviewer holds it to the rules and the code, never to where it came from: that session could not have written it without knowing or asking.
- Truth is checked for what the doc states, never for what it does not. The reviewer audits no system.
- Questions are about code in the scope whose why the docs do not hold. Code that merely looks odd is not a question.

## What the reviewer is told not to trust

- **Good prose is not evidence.** A dense, confident sentence is exactly what an agent produces when it restates code.
- A notes file. It is the human's list of what they know is open and says nothing about what has been checked. A scope with notes is reviewed exactly like one without.

## What comes back

The report is the product. A report nobody acts on is a valid outcome.

- Every document kept, with the sentence that justified keeping it, what it holds that the code does not, and the code files opened to decide. A scope called clean without that list was not checked.
- Every fix made, and everything the reviewer was not sure of.
- Questions about code it could not explain.

## After

The caller and the human read it. The reviewer cannot ask, so its questions reach the human through the caller, one at a time through the AskUserQuestion tool; the caller writes the answers, [how a change starts](updating-docs.md#how-a-change-starts). The reviewer never asks at the end, and the report is recorded nowhere.
