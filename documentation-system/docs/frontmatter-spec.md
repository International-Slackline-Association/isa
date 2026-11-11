---
type: reference
title: Frontmatter specification
description: The frontmatter fields every doc carries, the six types and their filing test, what makes a doc findable, and the sidebar key.
nav: { order: 40 }
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
| `nav` | no | `{ order, open, collapsible, sections }` | Docs-site sidebar only. See below. |

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

## Sidebar (`nav`)

Presentation for the docs site, under its own key so the fields above stay the contract. When to set `nav.order` is a step in [updating docs](updating-docs.md#before-any-doc); the other keys are for where the default is wrong.

- `nav.order`: sparse number (10, 20, 30), lower first. On a folder's `README.md` it positions the whole folder; a folder without a README takes the lowest order among its docs. Siblings without an order follow, folders before pages, alphabetical inside each. A `docs/` folder leads its siblings without needing an order.
- `nav.open`, folder READMEs only: is the folder expanded on load. Every folder is closed without it, at every depth, except the direct subfolders of one with `nav.sections`.
- `nav.collapsible`, folder READMEs only: `false` drops the chevron, so the section cannot be closed.
- `nav.sections`, folder READMEs only: its subfolders start open, each under a rule and a heading.

## Example

```yaml
---
type: policy
title: Billing boundary
description: Nothing outside the billing gateway may read subscription state.
related: [boundaries.md]
---
```
