---
type: explanation
title: "The user pool"
description: "Why the Cognito user pool is imported into CDK and never recreated, whose app clients it holds, and which clients may change: the identity stack, its stack policy, client ownership."
---

# The user pool

The pool is the one thing in isa-users that cannot be recreated. Passwords cannot be exported, and many apps depend on its ID, their client IDs and the users' passwords. So it was imported into CDK as it was, in its own stack, rather than built fresh like the table and the images bucket, which were copied into new resources.

Most of its app clients belong to apps that are not ours (SportHub, slackdata, highline-freestyle, slack-rescue-competition, the timer). We must not affect them: their client IDs, secrets and callback URLs stay as they are, and their clients stay in this stack for good. Changing a client's `GenerateSecret` replaces it with a new ID; the stack policy refuses that.
