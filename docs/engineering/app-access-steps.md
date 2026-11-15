---
type: how-to
title: "Giving an app access to an ISA service"
description: "Steps to add an endpoint for apps to a service (isa-users, isa-tools), grant or revoke an app's access in isa-users' list, deploy in order, and hand the app its client secret."
related: [app-access.md]
---

# Giving an app access to an ISA service

Why: [how apps reach ISA services](app-access.md).

## Goal

An app's server calls a service's endpoint with its own client, and nothing else.

## Steps

1. **A new endpoint:** add its scope to the service's `apiScopes` in its `infra/lib/config.ts`, and the route under `/v1`. The route checks the scope itself as well.
2. **Grant:** add the full scope name to the app's entry in `apps` in [isa-users' config](/isa-users/infra/lib/config.ts). A new entry creates the app's `{app}-service` client.
3. **Deploy** the service that defines the scope first, then `isa-users-prod-app`.
4. **Hand over** the client id and secret (Cognito, client `{app}-service`). An app in the monorepo reads the secret from SSM, created by hand.
5. **Revoke:** remove the scope, or the whole entry, and deploy isa-users. Removing the entry deletes the client.
6. **Removing a scope from a service:** revoke it from every app first, deploy isa-users, then the service.

## Verification

- The app gets a token from `https://auth.slacklineinternational.org/oauth2/token` and its call succeeds.
- A call without the scope, or with the path in other letter case, is refused.
