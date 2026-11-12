---
type: explanation
title: The theory of this system
description: >-
  Why the docs system exists and the three concepts it rests on (derivable or
  theory, scopes not levels, the why comes from the conversation), each a must,
  with its why and where its rules live. Read once.
---

# The theory of this system

## Why this exists

A human developer carries the plan, the concept, the idea, clarified in their head before coding and mostly never written. Agents lack that and lose it every session. Given a codebase, an agent forms a theory in minutes; the problem is that it rebuilds *a* theory, not *yours*, and the result is plausible, consistent, and wrong exactly where it matters: why this shape, what holds the weight, where it is going.

Letting agents write the high-level docs from their own theory makes it worse. The human detaches, slop takes over, perspective creeps. Agents add noise: mostly retrievable from the source, some irrelevant, some shadowing what matters. They don't know your future idea or how you will shape this.

The core idea: we end up creating more and more code without a human going through the necessary thought processes and problem-solving steps to build the theory of the software. Making the human go through that thought process is what this system is for. Every rule in it either makes the human do the thinking the code cannot show, or stops the agent from doing that thinking in their place.

This is Naur's *Programming as Theory Building* (1985), the program as the theory in the programmer's head rather than the code, made acute: a human colleague rebuilds the theory once and keeps it; an agent rebuilds from zero every session, so anything unwritten is re-invented each time, differently. That is **perspective creep**. For humans, docs supplement a theory that persists in people. For agents, docs are the only thing that persists.

Three concepts follow. Each is a must: the bold line is the concept, the paragraph is why, the last line is where its rules live.

## Derivable or theory

**A doc holds only what a competent worker cannot reconstruct from the artifact.**

Knowledge about a scope is either **derivable** (what code, config, tests and the running system show, reconstructible by looking) or **theory** (why, what matters, where it's heading, what was rejected), which cannot be reconstructed at any cost. A fact can be derivable while its reason is not. The human supplies what cannot be derived and decides what derivable knowledge is worth a doc; agents write the first down and keep the second true. A `reference` or `how-to` exists to gather knowledge that is spread wide, often overlooked by a fresh session, or slow to discover; that it is derivable by looking is not a reason against it, and whether one exists is the human's decision. A scope's nouns are theory too: the name is in the code; what the thing is and is not, and what it must never become, is not. Agents build from names, so a fixed vocabulary steers more code than a page of rules, and a synonym is how a new shape slips in under an old one. A scope that invented its own vocabulary is worth one explanation that writes it down, read before its other docs. The point is not cheaper rebuilding, which is already cheap, but a correct one: explanation docs make sure the theory the agent rebuilds every session is yours, not its own. In practice the failure is never too little: agents write too many docs, in excessive detail, verbosely, and we suffer from it. Getting rid of docs is the work; adding one is the exception.

A doc's `type` names which side of the line its content comes from. Docs carry no trust fields because their truth is checked against the code, and git answers who and when.

An explanation is written as you would tell a senior colleague on day one: the situation they are entering, why things are shaped this way, what was traded off, what matters most. Freestyle; rigid templates get filled with noise. Not every why: the ones a newcomer would otherwise get wrong; humans have the common sense for that, LLMs don't. Plans die, so most of the future stays in your head. Say what is not decided where something is; that sentence is where an agent stops guessing and asks. It is not required: a settled design has none, and forcing one produces questions that don't matter at the high level; agents already ask too many of those without checking whether the answer is derivable.

Rules: [content rules](content-rules.md); [frontmatter spec](frontmatter-spec.md); [updating docs](updating-docs.md#an-explanation-or-policy).

## Scopes, not levels

**Knowledge lives once, in the `docs/` of the lowest folder that contains everything it is about, and is reached from below by a link.**

"We use Postgres" is essential for a triage agent dropped into the repo with tool access (it must know its world before it starts) and noise for an agent implementing a feature in `slackmap/server/`, which discovers it in a minute. Same fact, same abstraction; theory in one place, noise in another. So the question is not "how abstract?" but **"derivable from inside the scope the reader is standing in?"** A scope is where work happens (repo, service, agent, feature), nesting as folders nest, and `docs/` sits next to the code because knowledge far from the code isn't found. Broad scope, fat doc; narrow scope, thin or none. Restatements drift, so lower scopes link and never copy.

### Progressive disclosure

**Every layer below the scope where knowledge is written holds pointers, not copies. Root `CLAUDE.md` imports one block, a nested `CLAUDE.md` imports its scope's README, and nothing else is imported.**

An agent is never handed everything; it is handed the right context at the right time and left to reason about what to open next. The README and the docs' frontmatter are that surface: the README says what exists and what above it matters, each sibling's type and description say what it is, and the agent decides. Because every doc carries its description, a README never restates it; upward links stay hand-written, since nothing else can produce them. The README is read on every task, so it stays small and theory goes in siblings. Root `CLAUDE.md` loads whether or not the task needs it, so it carries only what every session needs (the idea, the map, the must-nevers, and what else the human decides is default context), and any other import there would load into every session. A nested `CLAUDE.md` loads only when the agent works in its folder, so it is the one place an import is right: a pointer saying "read the README" is a bet the agent follows it; an import is not. Past the imports, reading is optional but encouraged: agents read to save time.

Rules: [folder convention](folder-convention.md); [reading docs](reading-docs.md#what-you-load-and-when).

## The why comes from the conversation

**A why is the human's, written down by the agent at the end of the change from what they said in the session, in their words. What the conversation did not give, the agent asks for; it never fills it in. A fix, an edit or a deleted claim, needs no asking.**

An agent does not know what to add within a scope from its task alone; left to judge from the task, it writes what the task needed, and that is the noise above, one doc at a time. But the conversation is the best information of why there is: the human shares it slowly, as the work goes, and by the end of a session the agent holds it. The theory cannot be fully written (Naur), and the agent asking at the edge (why, should-I, which-matters) is how the rest surfaces: the answer *is* theory. Answers left in conversations are the failure mode, not incompleteness, and nothing else in the system catches them: the reader below sees the change, not the conversation. So the agent writes what it was told, filtered by the content rules. A why out of the blue, with no conversation behind it, is never written: it would be the agent's theory in the human's mouth. The gate before every sentence was rejected because the whys it was meant to protect stayed in the chat; the check is the reader below and the human's review of the change. Because the human forgets, a reader that did not write the change questions what it left unexplained, and the human initiates from there.

### The adversarial reader

**Every change is read by a reader that did not write it, does not know the task and owes the text nothing. Where it is sure a rule is broken it fixes it; where it is not, it reports; what it could not explain, it asks.**

Adversarial in the plain sense: a fresh context with no memory of the task. It cuts what breaks these rules, hardest on excess, and adds nothing. A why another session wrote it trusts: that session could not have written it without knowing or asking. A whole reference or how-to it reports, never deletes: its existence is the human's. What it is unsure of it reports, all of it, and what in the changed code it could not explain it asks about. Questions, never suggested content: it has no theory to suggest from, and a suggestion would be its own theory in the human's mouth. A report nobody acts on is a valid outcome; the human initiates from it if it was worth it. Today the role is the `docs-review` agent, run on request. Whether a pull request fires it, and whether it stays one agent, is not decided.

Rules: [updating docs](updating-docs.md#how-a-change-starts). How a review runs: [adversarial review](adversarial-review.md); [the docs-review brief](/.claude/agents/docs-review.md).
