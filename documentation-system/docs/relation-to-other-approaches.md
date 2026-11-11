---
type: explanation
title: Relation to other approaches
description: >-
  Where this system came from and how it relates to C4, arc42, Diátaxis,
  AGENTS.md, spec-driven development, living documentation and Naur. Background
  only; not needed to use the system.
nav:
  order: 200
---

# Relation to other approaches

This system was arrived at by trying several existing frameworks and finding that each answered a different question. Per approach: what it is for, what was taken, and why it was not adopted wholesale. Not a survey; each is described only enough to place it relative to this system.

## Architecture documentation ladders: C4, L0–Ln, HLD/LLD

**What they are.** Hierarchies of technical zoom. C4: system context → container → component → code. The L0–Ln consulting convention: abstract → products → patterns → deep dives. HLD/LLD: high-level design, low-level design. They answer "how much technical detail is in this diagram, and for whom?"

**Why not adopted.** They measure abstraction. This system's rule is scope-relative derivability, and the two disagree (the Postgres test). Also: they are about *describing* a system; this system is about transferring the *theory* of it, which is not a description.

**Taken:** the instinct that broad views are for broad audiences. Here it falls out of scope width instead of being drawn as levels.

## arc42 and ISO/IEC/IEEE 42010

**What they are.** arc42: a 12-chapter template for architecture documentation. ISO 42010: the international standard for architecture *description*, built on stakeholders, concerns, viewpoints and views.

**Taken:** ISO 42010's insight that there is no single true view; different readers need different descriptions. Here, that becomes "different scopes need different explanations". arc42's habit of a fixed place for decisions and rationale.

**Why not adopted.** Both are heavyweight and template-driven; this system keeps structure below the type free. Neither addresses agents or the human/machine authorship boundary.

## Diátaxis

**What it is.** Four documentation types by user need: tutorial, how-to, reference, explanation. Don't mix them.

**Adopted with changes.** `tutorial` dropped; `policy`, `index`, `notes` added. See [The theory](the-theory.md#derivable-or-theory).

**One departure.** Diátaxis was designed for product documentation read by end users. Here it is applied to workers inside a codebase, and its "explanation" quadrant is re-read as Naur's theory.

## AGENTS.md and nested instruction files

**What they are.** Markdown files at repo root (and nested in subfolders) telling coding agents how to build, test and change a project. Open standard, stewarded by the Linux Foundation's Agentic AI Foundation since December 2025. Nested files apply to their folder and below; nearer files take precedence over ancestors.

**Taken:** the observation that filesystem placement is the cheapest, most reliable way to scope an instruction. In this repo the enforced rules live in `CLAUDE.md`; `AGENTS.md` is the same idea for other tools.

**Why not adopted as the docs system.** AGENTS.md is *instructions*: build commands, boundaries, style rules. It is not the theory. Its nested-inheritance model is also implicit and tool-dependent; this system chose explicit links instead ([Scopes, not levels](the-theory.md#scopes-not-levels)). AGENTS.md and this system are complementary: AGENTS.md tells the agent to read `docs/README.md`; the docs hold the knowledge.

Supporting evidence: studies of AGENTS.md effectiveness found human-written files containing non-obvious information outperformed LLM-generated ones, which tended to restate what was already in the repo. That is the content rule, observed in the wild.

## Spec-driven development (SDD)

**What it is.** A development workflow: write a spec, have agents derive code from it. Tooling: GitHub Spec Kit (constitution → specify → plan → tasks), AWS Kiro, Tessl. Birgitta Böckeler's ladder (Thoughtworks, Oct 2025): spec-first (spec discarded after use), spec-anchored (spec kept alive alongside code), spec-as-source (humans edit only the spec; code is generated, marked, never hand-edited).

**Why it looked close.** Both put human intent at the top and machine output at the bottom. Spec-as-source in particular has the human touching only one artifact.

**Why it is a different problem.** SDD answers "how does code get made?" This system answers "how does the theory of the code survive when the workers forget every session?" SDD is generative (spec → code). This system is descriptive at the bottom (code → reference) and prescriptive at the top (head → explanation). They touch at exactly one point: an explanation doc *could* be fed to an SDD tool as input. It doesn't have to be. This system works with any development style, including none.

**Taken:** Böckeler's lesson that the interesting phase is *maintenance*, not creation. Spec Kit's "constitution" resembles a repo-level explanation. Tessl's `GENERATED — DO NOT EDIT` stamp resembles what `type: reference` implies.

## Living documentation

**What it is.** Cyrille Martraire's practice: generate docs from the system wherever possible; humans write only what cannot be derived.

**Closest in spirit.** The content rule is essentially living documentation's founding principle. The difference: living documentation was about *automating* the derivable part. This system doesn't care whether the derivable part is automated, agent-written, or hand-written; it cares that the human doesn't spend attention on it, and that the non-derivable part is treated as a different kind of thing.

## Naur, "Programming as Theory Building" (1985)

**What it is.** The argument that the program is the theory in the programmer's head; that the theory cannot be recovered from code or docs; that maintenance without the theory is decay.

**Adopted as the foundation.** See [The theory](the-theory.md#why-this-exists). The system exists because agents are the first workers who lose the theory *every session*, which makes Naur's problem acute in a way it never was for human teams.

## Design rationale

**What it is.** A research field (1980s–90s, IBIS, QOC) about capturing the *why* behind design decisions, on the observation that the why is unrecoverable from the artifact.

**Taken:** the observation. Rationale is most of what an explanation holds. ADRs (Architecture Decision Records) are the modern lightweight form; here a decision is a sentence in the explanation, and a frozen record, when needed, is a spec.
