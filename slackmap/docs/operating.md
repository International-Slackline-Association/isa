---
type: how-to
title: Operating slackmap
description: "Running slackmap locally and deploying its CDK stacks (slackmap-prod-data, slackmap-prod-app): profile, order, verification."
nav: { order: 20 }
---

# Operating slackmap

## Goal

A change is running locally, or deployed and checked online.

## Steps

1. `corepack enable` once per machine; install from the project root.
2. Locally: `checkTs`; `dev` for the web app (it talks to the live API); the server's `build` then `invoke` to call a handler with an API Gateway, stream or schedule event. Export `AWS_PROFILE`, `AWS_REGION` and the variables the CDK stack sets first; `invoke` runs against production.
3. `diff`, then `deploy`, from the project root; both build the web app first. Pass a stack name to limit them.
4. A change to the table or the buckets is in `slackmap-prod-data`; check its diff for a replace before deploying. Recreating the table's stream changes its ARN in [config](/slackmap/infra/lib/config.ts).

## Verification

- `diff` shows no changes after the deploy.
- `slackmap.com` shows the map with its lines, a line's details and its images.
- The alarms topic sends nothing.
