---
type: index
title: "ISA users"
description: "Entry point for isa-users: ISA accounts and authentication. The Cognito user pool ISA apps sign in with, the users API at account-api, the account web app, profile pictures at images, with its CDK infra."
---

# ISA users

Account and authentication management for the ISA. The Cognito user pool is the login of several ISA apps; the account web app at `account.slacklineinternational.org`, its API at `account-api.slacklineinternational.org`, profile pictures at `images.slacklineinternational.org`.

## Read when

- Touching the user pool or its clients: [the user pool](user-pool.md): what may never change
- Running locally or deploying: [operating](operating.md)
- What is set up by hand and what other apps rely on: [manual operations](manual-operations.md)
- What is open: [notes](notes.md)

## From higher scopes

- [Infrastructure rules](/docs/engineering/infrastructure.md): the CDK shape and names `infra/` follows
- [Why one monorepo](/docs/the-monorepo.md): the users and the pool are critical data
- [Errors](/docs/engineering/errors.md): why errors arrive weekly as issues
