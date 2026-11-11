---
type: policy
title: General rules
description: "Rules for operating the AWS organization IaC: local deploys, cdk diff first, scope, CDK conventions, access through Identity Center."
nav: { order: 20 }
---
# General rules

## Operations

- No CI/CD. Deploys run locally.
- Always `cdk diff` before `cdk deploy`; name the stacks and use the matching
  profile (`isa-org-admin` management, `isa-admin` ISA).
- Audit history: CloudTrail Event History only (90 days). No trail.

## Scope

- Only org-wide and ISA-wide resources. App resources live in the app repos.
- Everything manual is listed in [manual-operations.md](manual-operations.md).

## CDK

- Stacks split by account/region and change frequency.
- Config in `config/organization.ts`, no context lookups.
- Long-lived resources: `RemovalPolicy.RETAIN` and termination protection.
- Never rename stacks or construct IDs. A "replace" in a diff is a stop.
- Exact-pinned dependencies, pnpm via corepack.

## Access

- Access only via Identity Center groups. No IAM users or access keys.
- Root users keep password + MFA. ISA root is needed for ISA support cases.
- Notifications go to role addresses (`aws@slacklineinternational.org`).
- Workloads only in allowed regions (`region-allowlist` SCP).
