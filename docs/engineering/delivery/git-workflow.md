---
type: policy
title: Git workflow
description: "Branch off main, open a PR, squash-merge it with a descriptive message and CODEOWNERS approval."
---

# Git workflow

- Developers branch off `main` into feature or bugfix branches and open PRs back into `main`; branch names and content are free.
- `main` is only updated by squash merging a PR.
- PR title is short and says what changes.
- The CODEOWNERS of every touched folder approve the PR.
  - Skip approval for trivial changes in your own folder.
- Once approved, squash merge your PR into `main` branch.
  - Write a descriptive commit message for the squash merge (not just title).

GitHub deletes the remote branch on merge.
