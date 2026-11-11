---
type: index
title: "AWS platform"
description: "Entry point for the ISA's AWS organization IaC (CDK): org-wide and ISA-wide resources, accounts, stacks, what to read before a deploy."
nav: { order: 10 }
---

# AWS platform

CDK for the ISA's AWS organization `o-1voshuzmv4`: guardrails, Identity Center access and ISA-wide resources. App resources live with the apps.

- Regions allowed: eu-central-1, eu-central-2, us-east-1, us-east-2.
- DNS for slacklineinternational.org and slackmap.com is at Cloudflare.
- Keep account contacts and payment current: AWS verification can suspend the account.

## Read when

- Any change or deploy: [general rules](general-rules.md): diff first, never rename stacks or construct IDs
- Which stack, account and profile: [stacks](stacks.md)
- Deploying, adding or removing a person: [operating](operating.md)
- Touching something CDK does not manage: [manual operations](manual-operations.md)
- What is open: [notes](notes.md)
