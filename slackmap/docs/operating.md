---
type: how-to
title: Operating slackmap
description: "Running slackmap locally and deploying its CDK stacks per stage (prod, test: slackmap-{stage}-data, slackmap-{stage}-app, slackmap-prod-cdn-logs in us-east-1): STAGE, profile, order, setting up a new stage, verification."
---

# Operating slackmap

## Goal

A change is running locally, or deployed and checked online.

## Steps

1. `corepack enable` once per machine; install from the project root.
2. Every root script but `checkTs` needs `STAGE`, `prod` or `test`; what differs per stage is in the [infra config](/slackmap/infra/lib/config.ts) and the [web stages](/slackmap/web/src/stages.ts).
3. Locally: `checkTs`; `dev` for the web app (it talks to the stage's live API through its proxy); the server's `build` then `invoke` to call a handler with an API Gateway, stream or schedule event. Export `AWS_PROFILE`, `AWS_REGION` and the variables the CDK stack sets first; `invoke` runs against the stage whose variables you exported. The server's `errorDigest` prints the issues it would write; the weekly workflow runs it with `--live`.
4. `diff`, then `deploy`, from the project root; both build the web app first. Pass a stack name to limit them.
5. A change to the table or the buckets is in `slackmap-{stage}-data`; check its diff for a replace before deploying. Recreating the table's stream changes its ARN in the infra config.
6. A new stage: its certificate first ([manual operations](manual-operations.md)); deploy its data stack alone (the app stack is left out until the stream ARN is set); copy prod's table and buckets into it before its app stack exists, so the stream handler does not replay the copy; set the stream ARN; deploy the app stack; set its uploads identity pool in the web stages and deploy again; then the DNS records. Its domain also goes into slackmap's sign-in URLs in [isa-users](/isa-users/infra/lib/identity-stack.ts) and the Mapbox token's allowed URLs.

## Verification

- `diff` shows no changes after the deploy.
- The stage's site (`slackmap.com`, `test.slackmap.com`) shows the map with its lines, a line's details and its images.
- No new or reopened `errors:slackmap` issue on the monorepo the Monday after.
