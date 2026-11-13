---
type: policy
title: Agent skill rules
description: >-
  The rules a skill, command, agent brief or hook obeys: knowledge is a link,
  docs beside a skill carry frontmatter, the agent never decides how-to versus
  skill or skill versus command, and the table of where each kind of
  instruction lives.
related: [agent-skills.md, content-rules.md]
---

# Agent skill rules

Why: [agent skills](agent-skills.md). These hold for every skill, command, agent brief and hook in the repo, in a plugin or in an agent config.

1. An instruction file holds no knowledge. Every fact and every why in it is a link to the doc that owns it; the file says what the agent does and where to read.
2. How a skill folder is arranged is the author's. Theory shipped beside a `SKILL.md` follows [the folder convention's edge case](folder-convention.md#edge-cases).
3. The agent never decides whether a procedure is a how-to or a skill, or whether something is a skill or a command. It asks.
4. A hook's text explains nothing. Its why is a link to the policy it enforces.

## Where an instruction lives

The doc types are [the frontmatter spec's](frontmatter-spec.md#the-six-types).

| What it is | Where it goes |
|---|---|
| A why | `explanation` |
| A rule | `policy` |
| A rule that must hold whatever the model does | a hook, its why linked |
| What every session in a scope must hold | the scope's `docs/README.md`, imported by its `CLAUDE.md` |
| A procedure anybody follows | `how-to` |
| The agent's method, or the announcement that a capability exists | a skill |
| A pre-recorded prompt a person runs | a command |
| A fresh-context role with its bounds | an agent brief |
| Facts | `reference` |

| The file is for | Its folder |
|---|---|
| every local session | the repo root's `.claude/` |
| consumers that opt in | a plugin in `.claude-plugins/` |
| one agent config | that agent config's `.claude/` |
