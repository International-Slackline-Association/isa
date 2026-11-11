---
type: policy
title: Git workflow
description: Branching, PR title and review rules, squash merging, and what a PR must cover before merging.
nav: { order: 40 }
---

# Git workflow

- Developers branch off `main` into feature or bugfix branches and open PRs back into `main`.

### GIT Rules

- `main` branch is protected, no direct commits are allowed.
- `main` branch is only updated via `Pull Requests` and `Squash Merging`.
- `feature branches` are NOT subject to any rules for naming or content.

### Pull Request Rules

- PR title is short and says what changes.
- The CODEOWNERS of every touched folder approve the PR.
  - Skip approval for trivial changes in your own folder.
- Once approved, squash merge your PR into `main` branch.
  - Write a descriptive commit message for the squash merge (not just title).
