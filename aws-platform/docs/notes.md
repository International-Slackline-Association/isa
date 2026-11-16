---
type: notes
title: "AWS organization: open"
description: "Open work in the AWS organization: domain renewals, backups, per-app accounts and accounts in CDK."
---

# AWS organization: open

- Renew slacklineinternational.org at NetEarth (expires 2026-11-25).
- Recurring backup copy outside the ISA account.
- Per-app accounts (SlackData, SportHub, perhaps slackmap); isolates developer access. With the first one, bring accounts under CDK (`AWS::Organizations::Account`), importing the ISA account.
