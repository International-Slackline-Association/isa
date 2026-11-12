---
type: policy
title: Folder convention
description: Exact rules for where docs/ folders go, what they contain, naming, the README, docs vs specs, agent instruction files, edge cases, and lifecycle.
related: [the-theory.md]
---

# Folder convention

Why: [the theory](the-theory.md). When to read what: [reading docs](reading-docs.md).

## Placement

| Rule | Statement |
|---|---|
| Location | `docs/` is a direct child of the folder whose scope it describes: the lowest directory that contains everything the doc is about. |
| Existence | A scope gets a `docs/` only if it has non-derivable knowledge. Absence of `docs/` is a valid statement: "nothing here you can't learn by looking." |
| Nesting | Scopes nest as folders nest. `slackmap/server/docs/` describes slackmap's server and everything under it. |
| Root | The repository root has a `docs/`. Anything there that is really about one component migrates down when touched. |
| Cross-cutting | Knowledge true across many scopes lives in the `docs/` of the highest folder where it is fully true, once. Lower scopes link to it and never restate it. |
| Moving | A doc's scope is its path. If a refactor narrows or widens what a doc is about, move it. |

Folders never carry retrieval semantics: a doc is found through its own `description` or through a link, never through its position.

## Contents of a `docs/` folder

| File | Required | Notes |
|---|---|---|
| `README.md` | Yes | `type: index`. Entry point. |
| `notes.md` | No | `type: notes`. What is open in the scope. One screen; the human prunes. |
| `*.md` siblings | No | Any of the six types, per the [frontmatter spec](frontmatter-spec.md). Free naming. |
| subfolders | No | Flat by default: type is in the frontmatter, topic in the filename, order in the README. A subfolder only for a real sub-topic with several docs, named for the topic, never for the type. Deeper than three levels means the tree is too deep. |

## Naming

- `README.md`, as everywhere else in the repo.
- Other files: lowercase, hyphen-separated, descriptive of content, not of type (`why-chat-first.md`, not `explanation-1.md`).
- No numbering prefixes; order is expressed in the README.

## The README

| Property | Rule |
|---|---|
| Size | One screen, under half a page. Over means content belongs in a sibling. |
| Orientation | 1–5 lines: what this scope is and what a worker should know exists. If the scope's whole theory is one sentence, it lives here. |
| Upward links | Links to docs in higher scopes that a worker here needs, each with one clause on why it matters here. This is the only mechanism by which higher-scope knowledge reaches this scope. Hand-written. |
| Reading order | Which sibling to read first and when the others matter, one clause each on why it matters here. Never a restated description: every sibling carries its own, and a copy drifts. A stale entry is worse than none. |
| Sideways links | Links to sibling scopes' docs where relevant. |
| Content | No theory. No reference tables. No procedures. |

## Links

A reference to a specific file in the repo is a markdown link, never a bare path in backticks: a link resolves on the site and in the editor, and breaks visibly when the file moves. Inside one scope's `docs/` folder the path is relative; anything outside it (another scope, the repo's `docs/`, a code file) is root-relative and starts with `/`, so a link never stacks `../`. Agent instruction and context files link the same way, with the file's own folder in place of `docs/`. A file read from a copy outside the repo (a plugin's pointer to a sibling plugin) names repo-relative paths in backticks: a link there resolves to nothing. A filename used as a kind, "every scope's `README.md`", code identifiers, glob patterns, placeholder and example paths, and the `@docs/README.md` import stay in backticks.

## Docs vs specs

`docs/` describes the system as it is today and is kept current. Point-in-time material (proposals, discussion notes, spec snapshots) lives in `specs/` (repo root) and carries no doc frontmatter. A sentence about the future in an explanation is allowed only as a constraint on today ("don't foreclose X"); the proposal itself is a spec.

## Agent instruction files

| File | Rule |
|---|---|
| Root `CLAUDE.md` | Imports [agent essential knowledge](agent-essential-knowledge.md), and otherwise holds what the human decides every session needs as default context: intent, the repo-wide must-nevers, the repo-wide conventions in one line each, paths into `docs/`. No scope's conventions. |
| Nested `CLAUDE.md` | Every scope with a `docs/` has one, and it is exactly `@docs/README.md`. No other content. Existing nested files that carry knowledge are unconverted. |
| `@import` elsewhere | Not used. In a doc, link instead. |
| `AGENTS.md` | Not used by default; optional. `CLAUDE.md` is the instruction file. |
| Skills, commands, agent briefs, hooks | No knowledge, only what the agent does and a link to where it is written: [agent skill rules](agent-skill-rules.md), with where each kind lives. |

## Edge cases

| Case | Rule |
|---|---|
| A folder `README.md` next to `docs/` | A scope has one entry point, `docs/README.md`. A folder README exists only where someone outside the repo lands on it: the repository root, and a package published for others to install. Everywhere else it is derivable or a copy; delete it. |
| Generated code folders | No `docs/`. Its rationale belongs in the scope that generates it. |
| Two folders that share theory but aren't nested | Put the theory in the lowest common ancestor's `docs/`; link from both READMEs. |
| Repository root already has a `README.md` for GitHub/consumers | Keep it. Make it point to [`docs/README.md`](/docs/README.md). |
| A folder with `docs/` is deleted or moved | Move `docs/` with it. Then fix every upward link that pointed into it. |
| Markdown in a `docs/` folder without frontmatter | Legacy, unconverted. It stays where it is until someone converts or deletes it; [reading docs](reading-docs.md#entering-a-scope) says how to read it. |
| A skill with theory behind it | The explanation and policy sit in the skill's folder beside `SKILL.md`, not in a `docs/`: a skill ships as one folder and its docs travel with it. They carry frontmatter like any doc. |

## Lifecycle of a doc

The human acts on these unless a row names an agent.

| Event | Action |
|---|---|
| A scope acquires non-derivable knowledge | The agent, [at the end of the change](updating-docs.md#at-the-end-of-a-change): create `docs/README.md` and the scope's `CLAUDE.md`; write the sentence there or in a sibling explanation; the README's orientation lines come from the human if the conversation did not give them. |
| The human changes their mind | Edit the explanation. Do not leave both versions. |
| The human knows their thinking moved but hasn't rewritten | Say so in the doc's first line; agents then ask before relying on it. |
| A doc no longer matches reality | Any agent corrects or deletes the false statement, in any type ([way 4](updating-docs.md#how-a-change-starts)); the human reviews for type purity and truth. |
| The knowledge in an explanation becomes derivable (now enforced in code, or obvious) | Any agent deletes the sentence, the file if empty, and `docs/` with the scope's `CLAUDE.md` if only the README remains and it says nothing. |
| A doc stopped being true and nobody will fix it | Any agent deletes it and fixes every link to it. |
| An agent asks a question the docs should have answered | The human answers; a theory answer the agent writes at the end of the change. A derivable answer means a README or description should have pointed there. |
