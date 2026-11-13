---
type: how-to
title: Operating isa-users
description: "Running isa-users locally and deploying its CDK stacks (isa-users-prod-identity, -data, -app): order, the identity stack's guard, verification."
---

# Operating isa-users

## Goal

A change is running locally, or deployed and checked online.

## Steps

1. `corepack enable` once per machine; install from the project root.
2. Locally: `checkTs`; `dev` for the web app (it talks to the live API and pool); the server's `build` then `invoke` to call the API handler with an API Gateway event, with or without authorizer claims. `invoke` and the server's `script` run against production with the caller's AWS environment. The server's `script errorDigest` prints the issues it would write; the weekly workflow runs it with `--live`.
3. `diff`, then `deploy`, from the project root; both build the web app first. Pass a stack name to limit them.
4. A change in `isa-users-prod-identity` touches the live pool and every app's client; its stack policy rejects a replace or delete.
5. A change to the users table or the images bucket is in `isa-users-prod-data`; check its diff for a replace before deploying.

## Verification

- `diff` shows no changes after the deploy.
- `account.slacklineinternational.org` signs in, shows the profile and uploads a picture.
- No new or reopened `errors:isa-users` issue on the monorepo the Monday after.
