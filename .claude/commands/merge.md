---
description: Review the current branch, then squash-merge it into main and push, without a PR.
argument-hint: "[what to say in the commit, if anything]"
disable-model-invocation: true
---

Merge the work on this branch into `main` directly: the squash merge of the [git workflow](/docs/engineering/delivery/git-workflow.md), without its PR and approval.

1. Stop on `main`: the work needs its own branch first.
2. Run the code review and the docs review on the branch, unless this session already ran both on its current state. Fix what is clearly broken; bring every finding, question and decision to the user and stop until they answer.
3. Commit what is uncommitted with a message that says what changes.
4. Squash-merge the branch into `main` with a descriptive message, push `main`, delete the branch.
5. Report the commit and what was verified and what was not.

Never force-push, never rewrite `main`'s history.

---

Arguments: $ARGUMENTS
