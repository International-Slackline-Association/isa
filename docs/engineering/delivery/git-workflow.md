---
type: policy
title: Git workflow
description: "Committing directly to main for now, and the branching, PR, review and squash-merge rules for when PRs are used again."
nav: { order: 40 }
---

# Git workflow

- For now there are no PRs: commits go directly to `main`.

### Pull Request Rules

When PRs are used again:

- Developers branch off `main` into feature or bugfix branches and open PRs back into `main`; branch names and content are free.
- `main` is then protected and only updated by squash merging a PR.
- PR title is short and says what changes.
- The CODEOWNERS of every touched folder approve the PR.
  - Skip approval for trivial changes in your own folder.
- Once approved, squash merge your PR into `main` branch.
  - Write a descriptive commit message for the squash merge (not just title).
