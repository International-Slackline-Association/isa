---
type: policy
title: Git workflow
description: "Working on a branch and squash-merging into main when done, for now without PRs, and the PR, review and squash-merge rules for when PRs are used again."
nav: { order: 40 }
---

# Git workflow

- For now there are no PRs. Work happens on a branch off `main`; when the human says it is done, the branch is squash-merged into `main` with a descriptive message.

### Pull Request Rules

When PRs are used again:

- Developers branch off `main` into feature or bugfix branches and open PRs back into `main`; branch names and content are free.
- `main` is then protected and only updated by squash merging a PR.
- PR title is short and says what changes.
- The CODEOWNERS of every touched folder approve the PR.
  - Skip approval for trivial changes in your own folder.
- Once approved, squash merge your PR into `main` branch.
  - Write a descriptive commit message for the squash merge (not just title).
