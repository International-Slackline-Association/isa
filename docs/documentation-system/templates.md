---
type: reference
title: Templates
description: >-
  Copy-paste skeletons for each doc type: README, explanation, policy, reference, how-to, notes. Structure below the type is a suggestion; the type is the contract.
---

# Templates

Kept in one file so the placeholders are not mistaken for docs. Copy the block, drop the comments. What each type may contain is in the [frontmatter spec](frontmatter-spec.md); the steps are in [updating docs](updating-docs.md).

## Nested CLAUDE.md

```markdown
@docs/README.md
```

## README

```markdown
---
type: index
title: "<Scope name>"
description: "Entry point for <scope>. What it is, what to read, what lives above it."
---

# <Scope name>

<1–5 lines. What is this scope? What should a worker know exists before touching it? Pointers, not theory.>

## Read when

- <doing what>: [<title>](<file>.md): <one clause: why it matters here, never its description>

## From higher scopes

- [<title>](/docs/<file>.md): <one clause: why it matters here>

## Related scopes

- [<sibling scope>](/<path>/docs/README.md): <one clause>
```

## Explanation

```markdown
---
type: explanation
title: "<What this doc explains>"
description: "<One sentence an agent reads to decide whether to open this. Say what understanding it gives.>"
---

# <Title>

<!-- Freestyle. Where something is not decided or not covered, say so. -->
```

## Policy

```markdown
---
type: policy
title: "<Rule in a few words>"
description: "<One sentence: the constraint.>"
related: [<path to the explanation that justifies this>]
---

# <Rule>

<!-- Never/always statements. No why; link it. -->

1. <Never / always …>
2. <…>

Why: [<explanation title>](<path>)
```

## Reference

```markdown
---
type: reference
title: "<What this describes>"
description: "<One sentence: which facts this holds, so a reader knows when to look here.>"
---

# <Title>

<!-- Facts reconstructible from the code only. Tables are usually the right shape. -->

| Item | Value | Notes |
|---|---|---|
| | | |
```

## How-to

```markdown
---
type: how-to
title: "<Achieve X>"
description: "<One sentence: the goal a reader has when they need this.>"
---

# <Achieve X>

## Goal

<One line. What is true when you're done.>

## Steps

1. <Imperative. One action: what to do and where it is defined, not the command.>
2. <…>

## Verification

- <How you know it worked.>
```

## Notes

```markdown
---
type: notes
title: "<Scope>: open"
description: "<One sentence: what kind of open items live here.>"
---

# <Scope>: open

- <What is open, one line each, in the human's words.>
```
