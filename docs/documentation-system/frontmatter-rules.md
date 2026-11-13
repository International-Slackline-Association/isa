---
type: policy
title: Frontmatter rules
description: >-
  Rules for frontmatter fields, status, writing a description, one type per
  file, where index and notes files live, notes items, and links between
  explanation, policy and specs.
---

# Frontmatter rules

Why: [derivable or theory](the-theory.md#derivable-or-theory). The fields and types: [frontmatter spec](frontmatter-spec.md).

1. Docs use no fields beyond the spec's. No `status`: what happens to a doc over time is the [lifecycle table](folder-convention.md#lifecycle-of-a-doc).
2. A `description` names what the doc is about with the terms a worker would search for (the concepts, the names, the questions it answers), so that a reader seeing only it decides correctly whether to open it. Terms, not claims: it does not restate the body's points, sections or conclusions.
3. One `type` per file. A file that needs two is two files. Frontmatter is authoritative over folder names.
4. `index` is only for `README.md`. `notes` is one flat file per scope, `docs/notes.md`.
5. A `notes` item is one line, deleted when it lands or graduates into another type; the file lists what is open, not history. If work cannot proceed without the answer, it is not a note but an undecided sentence in the explanation.
6. An `explanation` holds the whys, including decisions and what they rejected, and links the `policy`s it justifies. A decision that needs a frozen, dated record gets one in `specs/`, linked from the explanation.
