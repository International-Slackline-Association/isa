---
type: reference
title: slackmap manual operations
description: "What slackmap depends on that CDK does not manage: the slackmap.com certificate, Cloudflare records, SSM parameters (Mapbox tokens included), the pre-migration backup, the ISA account that administers groups, and the names other apps use."
---

# Manual operations

Not managed by CDK.

| Item | Where | Notes |
|---|---|---|
| Certificate `slackmap.com`, `*.slackmap.com` | ACM, us-east-1 | For the distributions. |
| Cloudflare CNAMEs `slackmap.com`, `www`, `api`, `data`, `images` | Cloudflare, slackmap.com | All → the distributions of `slackmap-prod-app`. DNS only. |
| SSM `slackmap-geonames-api-username` | Parameter Store | GeoNames account for country lookups. |
| SSM `isa-tools-trusted-service-api-key` | Parameter Store | isa-tools' API key, sent on its image-processing calls. |
| Backup `slackmap-prod-before-cdk-cutover` | DynamoDB backups | On-demand backup of the map data as it was before the move to CDK; the source table is deleted. |
| ISA account `slackmap@slacklineinternational.org` | isa-users | Holds owner rights on every group; its ISA id is in [config](/slackmap/infra/lib/config.ts). |
| GitHub label `errors:slackmap` | the monorepo's issues | Created once by hand; the error digest workflow finds its issues by it. |
| SSM `slackmap-mapbox-tokens` | Parameter Store | JSON `{prod, dev}` of the Mapbox public tokens the web build and `dev` read; `prod` is restricted to slackmap.com in the Mapbox console, `dev` allows localhost. |

Names other apps depend on: the `images.slackmap.com` URLs, bucket `slackmap-prod-images` (isa-tools' image processor writes to it).
