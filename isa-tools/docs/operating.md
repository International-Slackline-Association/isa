---
type: how-to
title: Operating isa-tools
description: "Running isa-tools locally and deploying its CDK stacks (IsaToolsData, IsaToolsApp): profile, order, verification."
nav: { order: 10 }
---

# Operating isa-tools

## Goal

A change is running locally, or deployed and checked online.

## Steps

1. `corepack enable` once per machine; install from the project root.
2. Locally: `checkTs`; `dev` for the web app (it talks to the live API); the server's `build` then `invoke` to call a handler with an API Gateway event, against real AWS (the profile, and the environment the CDK stack sets).
3. `diff`, then `deploy`, from the project root; both build the web app first. Pass a stack name to limit them.
4. A change to the documents table or the temporary-uploads bucket is in `IsaToolsData`; check its diff for a replace before deploying.

## Verification

- `diff` shows no changes after the deploy.
- `verify.slacklineinternational.org/?token=<an existing short code>` shows the document as verified.
- The alarms topic sends nothing.
