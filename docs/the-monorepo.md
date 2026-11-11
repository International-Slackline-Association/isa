---
type: explanation
title: Why one monorepo
description: "Why one public monorepo for the ISA projects, which projects are in scope, upgrades and migrations, critical data, per-app AWS accounts."
nav: { order: 5 }
---

# Why one monorepo

A monorepo gives agents all the context they need to do larger-scale development in good quality. It has more future than separate repos: much more standardization is possible, people (non-technical ones too) onboard more easily, and work can run sandboxed and deploy from remote environments (cloud sessions, self-hosted) instead of relying on a local GitHub setup. Separate repos joined by a shared workspace and shared docs were considered and rejected.

## Scope now

The maintainer's ISA projects first: the AWS organization, isa-tools, isa-users, then slackmap. The goal is to finish the monorepo in a good state for these. Other ISA projects (SlackData, SportHub, …) join later if their teams want to; how their access is limited inside the repo is out of scope until then.

Everything is public, the org infra included. Keeping the infra private, out of fear that people find vulnerabilities, was considered and not taken. The old repos' git history is not carried over: it is old and makes no difference.

## Upgrades as we go

None of these apps are critical production workloads. As long as the critical data is kept, anything may change: projects move in bit by bit and are upgraded as they go, towards shared practices (CDK instead of Serverless, one way to deploy). The first two or three projects that move in set those standards for the rest; frequently used building blocks, deploying first of all, become package scripts so things are standardized. A CloudFormation deploy can get stuck for quite a while, so nothing waits on one synchronously. Rules: [infrastructure](engineering/infrastructure.md).

There is no staging: a change is deployed and tested online. Downtime is fine, as long as no data is lost and old URLs keep working.

Critical data, never put at risk:

- ISA users and the Cognito user pool
- slackmap map data
- isa-tools issued documents: every certificate's QR code resolves through them
- org config: Identity Center, SES, certificates

## Not to foreclose

SlackData, SportHub and perhaps slackmap moving into their own AWS child accounts, so the groups that run them have full authority over and responsibility for their account. How is not decided.
