---
type: explanation
title: Agent skills
description: >-
  What a skill, command, agent brief or hook is relative to the docs: no
  knowledge, only what the agent does and where the knowledge lives; the two
  jobs of a skill; how-to or skill by audience; skill or command as the human's
  call; why a file sits at root, in a plugin or in an agent config.
related: [agent-skill-rules.md, the-theory.md]
---

# Agent skills

The documentation system is the home of everything written down as knowledge. An instruction file, a skill, a command, an agent brief or a hook, holds none of it. It says what the agent does and points to where the knowledge lives. How a skill is built inside is not the system's concern: people know skills, an agent learns them online, and the system draws the boundary with the docs and stops there. Rule 11 of the [content rules](content-rules.md#the-rules) is the one-line form; this doc is the why, and the [rules](agent-skill-rules.md) are beside it.

## What a skill is here

A skill does two jobs, and earns its place by either.

It **announces**. A skill's description sits in every session's context; docs do not. An autonomous agent, local or in the cloud, has to know which external systems and capabilities exist without a person reminding it, and without it searching the docs first. This is progressive disclosure with the description as the layer that always loads.

It **acts**. The body is executional instruction, how the agent works, a method the code cannot show. Nothing in a skill duplicates what a doc holds.

## How-to or skill

A how-to doc gives steps too, so a procedure has two possible homes. The audience decides. A procedure anybody should follow, running a service locally, say, is system knowledge, not agent knowledge, and is a how-to. A procedure that is the agent's way of working is a skill. Where a procedure sits on that line is the human's judgment: the agent asks and verifies the intention rather than filing it.

## Skill or command

A command is a pre-recorded prompt, written once instead of copy-pasted. A skill is a method explained and shown. They overlap, and the agent cannot make the distinction: it asks. Disabling model invocation on a skill is a state chosen for now, not a category.

## Agent briefs and hooks

An agent brief is a fresh context given a role and its bounds, `docs-review` for one. A hook is where a rule goes when prose is not enough: it holds whatever the model does, so its text explains nothing and its why is the policy it enforces.

## Where a file lives

An instruction file lives with the runtime that loads it, never with the scope it is about; that scope is reached by a link, as a README reaches upward. Which runtime means which folder is a table in [the rules](agent-skill-rules.md#where-an-instruction-lives).
