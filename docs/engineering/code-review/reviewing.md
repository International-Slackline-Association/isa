---
type: how-to
title: Reviewing an implementation
description: "How the code review agent works through a change: the package's own checks, the native code-review pass, the diff against the intent, the policies along the paths, the architecture questions, the complexity a change adds, what it does not flag and what it reports."
related: [the-review.md, ../coding/coding-rules.md]
nav: { order: 31 }
---

# Reviewing an implementation

Why: [code review](the-review.md). Today the reviewer is the `code-review` agent, launched by the `review-code` skill with a scope and an intent.

## Steps

Each step has a name. A full review runs every one but challenge, which runs only when named. The caller may narrow the review to any of them by name, and the report says which ran.

The checks run in background shells while the reviewer reads, so their output is ready when the report is.

1. **Checks.** Look in each touched package for the mechanical checks it already defines, lint, types, build, tests, in its scripts or task runner, and run the ones that exist. A failure is the first line of the report, once; the reviewer spends no judgment on what a tool already said.
2. **Bugs.** Claude Code's own `code-review` skill does this well at medium effort: off-by-one, null, wrong variable, swallowed error, a removed guard, a caller not updated. Invoke it on the scope with these instructions in its argument: medium effort; do not flag markdown or tests; follow every `@docs/README.md` import you meet and treat those docs as the conventions source beside `CLAUDE.md`; name the doc applied in every finding. Its output is candidates; verify each against the code before keeping it.
3. **Intent.** Hold the diff against the intent in both directions: what was asked and is not done, what is done and was not asked. Then follow what the change reaches one hop past the diff (callers, config, migrations, shared types) for what it changed without meaning to. Questions to the human, never findings.
4. **Rules.** [Coding rules](../coding/coding-rules.md) hold for every change. For every changed file, read the nearest `docs/README.md` at or above it and follow the upward links it gives; every `policy` reached that way is a rule for this change too. Hold the diff against each one and, for every finding, quote the rule and name the doc. Where the docs are silent, there is no rule to apply.
5. **Architecture.** Where the change adds a path, a part, an abstraction, a branch per edge case, or crosses a boundary, name it and ask the question [how we build](../how-we-build.md) would ask. Questions to the human, never findings.

6. **Complexity.** Where the change adds complexity for a speculative or vanishingly unlikely race or security edge case, name the concrete failure mode, its likelihood and the complexity cost, and ask whether the human bought in.
7. **Challenge**, only when asked. The reviewer takes the other side of the design: argues for a simpler architecture, names the complexity it would remove and the robustness it would gain, and states the trade-offs honestly, including where the current design is right. Alternatives are welcome here and nowhere else. Everything in this section is the reviewer's own position, marked as such, for the human to argue with; none of it is a finding, and none of it is recorded anywhere unless the human says so.

## Not flagged

Style, naming or formatting. Tests, their presence, absence or content. Code comments and docs. Anything step 1 already reported. Anything the change did not touch or reach. Anything without a concrete failure scenario and a `file:line` or a command output as evidence. Not certain means not reported.

## The report

Findings first, each with file and lines, the claim in one sentence, the evidence, and the rule quoted where one applies. Then the intent and architecture questions, then the reviewer's opinion of the change, marked as its own. Then one line naming anything that could not run and why. The reviewed tree is never changed.
