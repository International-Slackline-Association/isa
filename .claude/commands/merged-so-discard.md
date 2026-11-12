---
description: After a PR is squash-merged, remove its local branch and worktree and fast-forward local main.
argument-hint: "[branch]  (none: every local branch whose PR is merged)"
disable-model-invocation: true
---

Clear what a merged PR leaves behind locally. The workflow: [git workflow](/docs/engineering/delivery/git-workflow.md).

Run every git command as `git -C <primary checkout>`, the first path in `git worktree list`.

1. `git fetch --prune origin`.
2. Candidates: the branch in the arguments, or every local branch except `main`. Keep only those with a merged PR: `gh pr list --head <branch> --state merged --json number,headRefOid`, never `git branch --merged`.
3. Skip and report a candidate when:
   - its local tip is not the merged PR's `headRefOid`;
   - the worktree that has it checked out has uncommitted or untracked changes.
4. For each remaining branch:
   - checked out in a worktree: `git worktree remove <path>`;
   - checked out in the primary checkout: `git switch main` there;
   - then `git branch -D <branch>`.
5. Fast-forward `main`: `git merge --ff-only origin/main` in the worktree that has it checked out, or `git fetch origin main:main` when none has. If that fails, report why and leave it.
6. Report each branch as discarded or kept, with the reason, and whether `main` moved.

Never `--force`, never push, never delete a remote branch.

---

Arguments: $ARGUMENTS
