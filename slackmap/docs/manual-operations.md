---
type: reference
title: slackmap manual operations
description: "What slackmap depends on that CDK does not manage, per stage: the slackmap.com and test.slackmap.com certificates, Cloudflare records and the Turnstile widget, SSM parameters (Mapbox tokens, the isa-users client secret, the Turnstile secret, the session and pass signing keys and the origin secret included), the pre-migration backup, the ISA account that administers groups, and the names other apps use."
---

# Manual operations

Not managed by CDK. Every `slackmap-*` parameter serves both stages.

| Item | Where | Notes |
|---|---|---|
| Certificate `slackmap.com`, `*.slackmap.com` | ACM, us-east-1 | For prod's distributions. |
| Certificate `test.slackmap.com`, `*.test.slackmap.com` | ACM, us-east-1 | For test's distributions. |
| Cloudflare CNAMEs `slackmap.com`, `www`, `api`, `data`, `images` | Cloudflare, slackmap.com | All → the distributions of `slackmap-prod-app`. DNS only. |
| Cloudflare CNAMEs `test`, `api.test`, `data.test`, `images.test` | Cloudflare, slackmap.com | All → the distributions of `slackmap-test-app`. DNS only. |
| Turnstile widget `slackmap` | Cloudflare, Turnstile | Mode managed, hostname `slackmap.com` (covers its subdomains). Its site key is in [session.ts](/slackmap/web/src/app/session.ts). |
| SSM `slackmap-turnstile-secret` | Parameter Store | The widget's secret. |
| SSM `slackmap-session-signing-key` | Parameter Store | RSA-2048 private key signing the session cookies; its public half is [session-public-key.pem](/slackmap/infra/session-public-key.pem). Replace it only together with the pem, then deploy; it ends every open session. |
| SSM `slackmap-pass-signing-key` | Parameter Store | RSA-2048 private key blind-signing the passes of rig reports; its public half is in [passes.ts](/slackmap/web/src/app/components/LineRig/passes.ts). Replace it only together with that key, then deploy; unspent passes stop working. |
| SSM `slackmap-origin-secret` | Parameter Store | Random value CloudFront sends to the API; `dev` sends it too, to get a session without the browser check. |
| SSM `slackmap-geonames-api-username` | Parameter Store | GeoNames account for country lookups. |
| SSM `slackmap-isa-users-client-secret` | Parameter Store | Secret of slackmap's client for the isa-users API; its client id is in [config](/slackmap/infra/lib/config.ts). |
| Backup `slackmap-prod-before-cdk-cutover` | DynamoDB backups | On-demand backup of the map data as it was before the move to CDK; the source table is deleted. |
| ISA account `slackmap@slacklineinternational.org` | isa-users | Holds owner rights on every group; its ISA id is in [config](/slackmap/infra/lib/config.ts). |
| GitHub label `errors:slackmap` | the monorepo's issues | Created once by hand; the error digest workflow finds its issues by it. |
| SSM `slackmap-mapbox-tokens` | Parameter Store | JSON `{prod, dev}` of the Mapbox public tokens the web build and `dev` read; `prod` is restricted to slackmap.com and test.slackmap.com in the Mapbox console and serves both stages, `dev` allows localhost. |

Names other apps depend on: the `images.slackmap.com` URLs.
