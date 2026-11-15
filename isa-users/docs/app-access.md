---
type: explanation
title: "How other apps reach users"
description: "How ISA apps, in the monorepo or outside it, get user data from isa-users: sign-in, generic endpoints called with each app's own client, the per-app access list in config, scopes, the full profile, users reading their own data, and API keys."
---

# How other apps reach users

Users are a basic need of many ISA apps, in this monorepo and outside it, so this is a pattern to keep for a long while. No app reads the users table or the pool directly: a user signs in to an app through the pool, and the app's server asks isa-users' endpoints.

The goal is not to hide user data such as emails, nor to segregate users so they serve certain apps only. isa-users offers generic endpoints that any app may need, in one style, overseen by the maintainer; config declares which app can reach which endpoint. Each endpoint is one OAuth scope, and each app calls with its own client (client credentials), granted only the scopes on its list. An endpoint returns the full profile: a narrower endpoint per purpose was considered and not taken.

API keys were considered and rejected.

A signed-in user reading their own data through another app is not needed now; when it is, it stays whatever is simplest, since a user can only reach their own data anyway.
