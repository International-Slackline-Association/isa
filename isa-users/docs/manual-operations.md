---
type: reference
title: isa-users manual operations
description: "What isa-users depends on that CDK does not manage: the API custom domain, the identity stack's stack policy, Cloudflare records, the hosted UI look, groups, SES, and the names other apps use."
nav: { order: 30 }
---

# Manual operations

Not managed by CDK.

| Item | Where | Notes |
|---|---|---|
| API Gateway custom domain `account-api.slacklineinternational.org` | API Gateway, eu-central-1 | Regional, wildcard certificate of `IsaShared`. Only its base path mapping is in `isa-users-prod-app`. |
| Stack policy of `isa-users-prod-identity` | CloudFormation | Denies `Update:Replace` and `Update:Delete` on every resource. Set by hand after the import. |
| Cloudflare CNAMEs `account`, `account-api`, `images`, `auth` | Cloudflare, slacklineinternational.org | `account` and `images` → the CloudFront distributions of `isa-users-prod-app`; `account-api` → the custom domain's regional name; `auth` → the pool's custom domain. DNS only. |
| Hosted UI CSS and logo | Cognito, pool `isa-users` | Copies in [infra/cognito](/isa-users/infra/cognito/). |
| Group `timeradmin` | Cognito, pool `isa-users` | The timer's. |
| SES identity `slacklineinternational.org` | SES | The pool's and the Cognito trigger's sender, from aws-platform. |
| Backup `isa-users-prod-before-cdk-cutover` | DynamoDB backups | On-demand backup of the users as they were before the move to CDK; the source table is deleted. |
| SSM `isa-tools-trusted-service-api-key` | Parameter Store | isa-tools' API key, sent on its image-processing and certificate calls. |

Names other apps depend on: pool `eu-central-1_iGaYGKeyJ`, its client IDs, the `auth` domain, table `isa-users-prod-users` (slackmap reads it), the `images` URLs.
