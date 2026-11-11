---
type: reference
title: Manual operations
description: "What in the AWS organization is not managed by CDK: accounts, root users, Identity Center instance, domains and DNS records, email, CDK caveats, bootstrap."
nav: { order: 30 }
---
# Manual operations

Not managed by CDK. Update this page when something here changes.

## Accounts

| Item | Where | Notes |
|---|---|---|
| Management account `307498582548` | AWS Settings (Builder ID) | Root can@slacklineinternational.org, password + MFA |
| ISA account `387132903656` | Org member (invited) | Root info@slacklineinternational.org, password + MFA |
| Organization `o-1voshuzmv4` | Organizations console | All features, centralized root access on |
| Payment, contacts, alternate contacts | Billing / Account, per account | Keep current, or AWS verification may suspend the account |
| Support | Support Center | Basic plan. ISA cases must come from ISA root |
| eu-central-2 opt-in region | Account settings, ISA | Enabled (Slackline Timer) |

## Identity Center

| Item | How |
|---|---|
| Instance `d-9967b127c9`, eu-central-1 | Multi-account permissions on |
| Users | Created in the console; invite via Reset password → send email |

## Domains and DNS

| Domain | Registrar | DNS |
|---|---|---|
| isa-rankings.org, slackdata.org, slacklinesport.org | Route 53 Domains, ISA (auto-renew) | Route 53, ISA |
| slackline.app | Joker.com | Route 53, ISA |
| slacklineinternational.org | NetEarth (expires 2026-11-25) | Cloudflare |
| slackmap.com | Cloudflare | Cloudflare |

Cloudflare records AWS depends on (slacklineinternational.org):
- 3 SES DKIM CNAMEs
- ACM validation CNAME `_7c97dffed5df53df43955621f1777214` (certificate renewal)
- MX → Google Workspace

## Email

- `aws@slacklineinternational.org`: Google Workspace alias, forwarding set in Google.
- SES: production access; bounce/complaint → isa-tools SNS topic (not in CloudFormation).

## CDK caveats

| Resource | Caveat |
|---|---|
| SES domain identity | DKIM keys not modelled; never add them |
| Wildcard certificates | All properties create-only; changes mean a new certificate + Cloudflare record |
| Monthly Budget (`IsaBilling`) | Name and recipients create-only; a change replaces the budget |

## CDK bootstrap

- management eu-central-1 and us-east-1; ISA us-east-1.
- ISA eu-central-1 / eu-central-2: shared with Slackline Timer; don't re-bootstrap with other options.
