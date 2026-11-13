---
type: reference
title: Frontmatter specification
description: The frontmatter fields every doc carries, the six types and their filing test, what makes a doc findable.
---

# Frontmatter specification

Every converted file under a `docs/` folder begins with YAML frontmatter delimited by `---`. A doc is converted, and findable, when `type` and `description` are both non-empty. The rules for them: [frontmatter rules](frontmatter-rules.md).

## Fields

| Field | Required | Values | Purpose |
|---|---|---|---|
| `type` | yes | `explanation`, `policy`, `reference`, `how-to`, `index`, `notes` | How the doc is read and where its content may come from. |
| `description` | yes | one or two sentences | The doc's search surface: agents choose what to open from title, description and path. |
| `title` | no | one line | Display title. Derived from the H1 or filename when absent. |
| `related` | no | list of paths | Cross-references not in the README. Read by humans and agents; no tool acts on it. |

## The six types

| `type` | It… | Filing test | Source |
|---|---|---|---|
| `explanation` | gives understanding: why, context, what matters, what is not decided | *Does it teach why?* | the human's head, in conversation or their own writing |
| `policy` | states a rule to follow, without the why | *Does it say never/always?* | the human's head |
| `reference` | lists exact facts about what exists | *Does it list facts?* | the code |
| `how-to` | gives steps to a goal | *Does it give steps?* | the code; the human where a step encodes judgment |
| `index` | orients and links; the entry point of a `docs/` | *Does it only point?* | anyone; links only |
| `notes` | lists what is open in the scope and has not found its type yet: ideas, overlooked work, things to come back to | *Is it open, and can work proceed without it?* | the human, in their words |

## Example

```yaml
---
type: policy
title: Billing boundary
description: Nothing outside the billing gateway may read subscription state.
related: [boundaries.md]
---
```
