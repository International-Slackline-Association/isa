---
description: Commit the current branch, push it and open a PR into main.
argument-hint: "[what to say in the PR, if anything]"
disable-model-invocation: true
---

Open a PR for the work on this branch, per the [git workflow](/docs/engineering/delivery/git-workflow.md).

1. Stop on `main`: the work needs its own branch first.
2. If this session has not run `/review-code` on the change, remind the user before going on.
3. Commit what is uncommitted with a message that says what changes.
4. Push the branch with upstream tracking.
5. Open the PR into `main`. Body: fill [the PR template](/.github/PULL_REQUEST_TEMPLATE.md), plus what was verified and what was not.
6. Report the PR link.

Never force-push, never push to `main`, never merge.

---

Arguments: $ARGUMENTS
