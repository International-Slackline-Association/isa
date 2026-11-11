---
type: policy
title: Content rules
description: >-
  The hard rules for what a doc may contain: derivability, salience, the deletion test for scope, the inward boundary, once, type, task residue, the future, excess, and agent-facing prose.
related: [the-theory.md]
nav: { order: 20 }
---

# Content rules

Why: [derivable or theory](the-theory.md#derivable-or-theory). These hold for every claim in every doc under a `docs/` folder and in every agent instruction file. `X` is the scope the doc describes. Apply per claim, not per sentence: "X is shaped so, because Y" is two claims, and the decision taken is what the code already shows while the alternative rejected is not.

A claim survives only if it passes every rule. The default verdict is out; a doc that fails is deleted, not trimmed into something shorter that still fails.

## The rules

1. **Derivability.** A claim a competent worker inside `X` can reconstruct by looking at code, config, tests or the running system is out, linear traces (an import, a call site, a config key) first of all. By looking means one hop from inside `X`: the scope's files and what they directly reference. Knowledge that has to be assembled across scopes is in the code but not derivable by looking; a doc holding it is a map, which earns its place until the scopes below hold their parts.

2. **Salience.** A claim that does not change what a worker does is out, however true.

3. **Deletion.** A claim belongs to `X` only if deleting `X` would make the claim pointless. If deleting something *else* would make it pointless, it belongs to that thing.

4. **Inward boundary.** A doc says only what is inside its own boundary: its code, its contracts, its decisions. Who calls it, who consumes it, and their tooling are out; that knowledge belongs to the consumer, who points in. The owner never points back.

5. **Outside is a link.** Knowledge whose home is another scope, a higher scope or a tool is linked, never described. The one clause a README may add is why it matters here.

6. **Once.** A claim exists in one place. A second copy, restated or paraphrased, is out wherever it is not the owner. A synonym for a scope's noun is a second copy.

7. **Type.** A why in a `reference` or `how-to` is out; steps or facts in an `explanation` are out beyond the clause that lets the why be read; a `policy` carries no why, only a link to one.

8. **Task residue.** What only your task needed is out. The reader is the next worker in `X` with a different task.

9. **The future.** A sentence about where `X` is heading is in only as a constraint on today: what not to foreclose. A plan, a proposal or a design for later is a spec, not a doc.

10. **Excess.** Detail nobody acts on, a paragraph that says in five lines what one would, a doc whose survivors would fit in its README: out.

11. **Agent-facing prose.** An instruction or context file (`CLAUDE.md`, an agent brief) holds only intent and the invariants an agent would get wrong by default: what, and what must never happen. Never how, and never a rule a doc already owns. A skill or command body is the how, loaded on demand; it restates nothing a doc owns and carries no why. Rules: [agent skill rules](agent-skill-rules.md).

The list grows; a rule is added when a doc passes all of these and still should not exist.

## The document

The rules above decide a claim. The file is decided by what they leave: a doc exists only if its surviving claims would not fit in the scope's README, and deleting the file would lose something the code does not hold. A doc that fails is deleted, its survivors moved to the README.

A `reference` or `how-to` is the exception: rule 1 neither deletes it nor its claims ([why](the-theory.md#derivable-or-theory)). The other rules still cut, and an agent keeps it true; adding or removing one is the human's.

## Examples

| Sentence | Rule that decides | Verdict |
|---|---|---|
| "The datastore is Postgres." (X = a feature folder) | 1, discoverable in the first minute | out |
| "The datastore is Postgres." (X = a triage agent's operating scope) | 1 fails to exclude, 2 passes: the agent is dropped in with tools and needs its world | in, as a fact |
| "Functionality goes in the chat session as much as possible." | 2, every feature decision | in, as a constraint |
| "This service is called by the checkout app." | 4, the subject is the consumer | out; the checkout app's docs point here |
| "Deploys go through the pipeline described in `infrastructure/docs/`." | 5 | a link, nothing after it |
| "`psql "host=… user=postgres sslmode=require"`" (a how-to step) | 1 and 10: the invocation is reconstructible from the endpoint and the client | out; "open a session as the master" in |
| "This could grow into multi-tenant." | 9, don't foreclose it | in, as background |
| "I haven't decided how billing works yet." | 2, stop and ask | in, as not decided |
| "Nothing outside the billing gateway may read subscription state." | 7 | in, as a `policy`, its why in the explanation |
| "We chose Postgres over SQLite because…" | 1: the choice is derivable, the rejection is not | the why and the rejected alternative in; the choice only as the clause that carries them |

## What the rules do not check

- Truth. A false rationale passes. Review for truth separately.
- Quality. A vague rationale passes. Review for whether a reader can predict the human's decisions from it.
- Completeness. The rules are per claim. They cannot say what is missing; the adversarial reader's questions do that.
