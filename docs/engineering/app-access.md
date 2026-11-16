---
type: explanation
title: "How apps reach ISA services"
description: "How ISA apps, in the monorepo or outside it, call ISA services such as isa-users and isa-tools: each app's own client, one OAuth scope per endpoint, the one access list in isa-users, generic endpoints, the full user profile, users reading their own data, API keys."
related: [app-access-steps.md]
---

# How apps reach ISA services

Users and documents are basic needs of many ISA apps, in this monorepo and outside it, so this is a pattern to keep for a long while. No app reads another service's table or the user pool directly: a user signs in to an app through the pool, and the app's server calls the service's endpoints.

The goal is not to hide data such as user emails, nor to segregate users so they serve certain apps only. Services offer generic endpoints that any app may need, in one style, overseen by the maintainer. Each endpoint is one OAuth scope, and each app calls with its own client (client credentials), granted only the scopes on its list.

The access list is one, in isa-users, across every service: the user pool is ISA's sign-in, each service defines its own scopes, and one place says which app may call what. A list per service, with a client per app in each, was considered and not taken.

isa-users' user endpoint returns the full profile: a narrower endpoint per purpose was considered and not taken.

API keys were considered and rejected.

Everything does what its own thing is best at: a need such as image processing is done inside each project, however it wishes, not offered as a shared service. That slackmap and isa-users do the same resizing twice is accepted. Which side a new need falls on, a shared service or inside each project, is the maintainer's judgement; an agent asks.

A signed-in user reading their own data through another app is not needed now; when it is, it stays whatever is simplest, since a user can only reach their own data anyway.
