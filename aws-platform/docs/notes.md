---
type: notes
title: "AWS organization: open"
description: "Open work in the AWS organization: domain renewals, backups, per-app accounts, IAM cleanup."
---

# AWS organization: open

- Renew slacklineinternational.org at NetEarth (expires 2026-11-25).
- Recurring backup copy outside the ISA account.
- Move Route 53 domain registrations out of the workload account.
- Per-app accounts (SlackData, SportHub, perhaps slackmap); isolates developer access.
- With Rankings: delete `isa-rankings-iam-user`, rename `rankings-dev-access`.
- Bring ISA's org membership under CDK (`AWS::Organizations::Account`).
