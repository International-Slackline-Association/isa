---
type: how-to
title: Operating
description: "Deploying a stack of the AWS organization, and adding or removing a person in Identity Center."
---

# Operating

## Goal

A stack change is deployed, or a person has (or no longer has) access.

## Steps

Deploy, from `aws-platform/`:

1. `corepack enable` once per machine, then install and build.
2. `pnpm cdk diff <stack...> --profile <profile>`; profile per stack in [stacks](stacks.md).
3. `pnpm cdk deploy` with the same stacks and profile.

Add a person:

1. Create the user in the Identity Center console and send the invite (user → Reset password → send email).
2. Add the username to `users` and groups in [config/organization.ts](/aws-platform/config/organization.ts), then deploy `IsaIdentityCenter`.

Remove a person: config + deploy first, then delete the user in the console.

## Verification

- `cdk diff` shows no changes after the deploy.
