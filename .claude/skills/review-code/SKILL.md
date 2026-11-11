---
name: review-code
description: Adversarial review of finished implementation by a fresh agent, on the working tree or a pull request.
disable-model-invocation: true
argument-hint: "<scope of the review & spectrum>"
---

You are the trigger, not the reviewer. The review is done by the `code-review` agent in a background mode to not block the session, a fresh context that did not write the change and must not learn how it was made; you are the wall between your session and it. How the review works is `docs/engineering/code-review/`.

Your job is to carry across what the agent cannot recover on its own, and nothing else:

- The scope: the working tree, or the pull request, anything mentioned as scope here.
- The spectrum: which of the review's steps to run, by the names [reviewing an implementation](/docs/engineering/code-review/reviewing.md) gives them. Nothing named means every step but `challenge`.
- The intent: the reason the whole change is made, traced to its source. The ticket or issue, the spec, the pull request body, and what this session was asked to do and why. Pass the sources themselves or their content, not your summary of the diff. Nothing about how the work was done.

Launch the agent with those three. Relay its report: findings through `ReportFindings` when the tool exists, one entry each with the reviewer's verdict; questions and anything that could not run in prose. No tool, all prose. It reviews; you carry.

---

Triggered args: $ARGUMENTS
