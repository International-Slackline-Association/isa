---
type: reference
title: Frontmatter specification
description: The frontmatter fields every doc carries, the six types and their filing test, what makes a doc findable.
---

# Frontmatter specification

Every converted file under a `docs/` folder begins with YAML frontmatter delimited by `---`. A doc is converted, and findable, when `type` and `description` are both non-empty.

## Fields

| Field | Required | Values | Purpose |
|---|---|---|---|
| `type` | yes | `explanation`, `policy`, `reference`, `how-to`, `index`, `notes` | How the doc is read and where its content may come from. |
| `description` | yes | one or two sentences | The doc's search surface: agents choose what to open from title, description and path. Name what the doc is about with the terms a worker would search for (the concepts, the names, the questions it answers) so that a reader seeing only this decides correctly whether to open it. Terms, not claims: it does not restate the body's points, sections or conclusions. |
| `title` | no | one line | Display title. Derived from the H1 or filename when absent. |
| `related` | no | list of paths | Cross-references not in the README. Read by humans and agents; no tool acts on it. |

Docs use no other fields.

## No status

Docs carry no `status`; what happens to a doc over time is the [lifecycle table](folder-convention.md#lifecycle-of-a-doc).

## The six types

| `type` | It… | Filing test | Source |
|---|---|---|---|
| `explanation` | gives understanding: why, context, what matters, what is not decided | *Does it teach why?* | the human's head, in conversation or their own writing |
| `policy` | states a rule to follow, without the why | *Does it say never/always?* | the human's head |
| `reference` | lists exact facts about what exists | *Does it list facts?* | the code |
| `how-to` | gives steps to a goal | *Does it give steps?* | the code; the human where a step encodes judgment |
| `index` | orients and links; the entry point of a `docs/` | *Does it only point?* | anyone; links only |
| `notes` | lists what is open in the scope and has not found its type yet: ideas, overlooked work, things to come back to | *Is it open, and can work proceed without it?* | the human, in their words |

Rules:

- One `type` per file. A file that needs two is two files. Frontmatter is authoritative over folder names.
- `index` is only for `README.md`. `notes` is one flat file per scope, `docs/notes.md`.
- A `notes` item is one line, deleted when it lands or graduates into another type; the file lists what is open, not history. If work cannot proceed without the answer, it is not a note but an undecided sentence in the explanation.
- `explanation` holds the whys, including decisions and what they rejected, and links the `policy`s it justifies. `policy` carries its why as a link to an `explanation`. A decision that needs a frozen, dated record gets one in `specs/`, linked from the explanation.

## Example

```yaml
---
type: policy
title: Billing boundary
description: Nothing outside the billing gateway may read subscription state.
related: [boundaries.md]
---
```
