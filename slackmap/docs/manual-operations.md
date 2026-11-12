---
type: reference
title: slackmap manual operations
description: "What slackmap depends on that CDK does not manage: the API custom domain, the slackmap.com certificates, Cloudflare records, SSM parameters (Mapbox tokens included), the pre-migration backup, and the names other apps use."
nav: { order: 30 }
---

# Manual operations

Not managed by CDK.

| Item | Where | Notes |
|---|---|---|
| API Gateway custom domain `api.slackmap.com` | API Gateway, eu-central-1 | Regional, its own `slackmap.com` certificate. Only its base path mapping is in `slackmap-prod-app`. |
| Certificates `slackmap.com`, `*.slackmap.com` | ACM, us-east-1 and eu-central-1 | us-east-1 for the distributions, eu-central-1 for the API domain. |
| Cloudflare CNAMEs `slackmap.com`, `www`, `api`, `data`, `images` | Cloudflare, slackmap.com | `api` → the custom domain's regional name; the others → the distributions of `slackmap-prod-app`. DNS only. |
| SSM `slackmap-geonames-api-username` | Parameter Store | GeoNames account for country lookups. |
| SSM `isa-tools-trusted-service-api-key` | Parameter Store | isa-tools' API key, sent on its image-processing calls. |
| Backup `slackmap-prod-before-cdk-cutover` | DynamoDB backups | On-demand backup of the map data as it was before the move to CDK; the source table is deleted. |
| SSM `slackmap-mapbox-tokens` | Parameter Store | JSON `{prod, dev}` of the Mapbox public tokens the web build and `dev` read; `prod` is restricted to slackmap.com in the Mapbox console, `dev` allows localhost. |

Names other apps depend on: the `images.slackmap.com` URLs, bucket `slackmap-prod-images` (isa-tools' image processor writes to it).
