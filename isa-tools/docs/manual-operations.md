---
type: reference
title: isa-tools manual operations
description: "What isa-tools depends on that CDK does not manage: the API custom domain, Cloudflare records, SSM parameters, the on-demand backup, and the names other apps use."
---

# Manual operations

Not managed by CDK.

| Item | Where | Notes |
|---|---|---|
| API Gateway custom domain `tools-api.slacklineinternational.org` | API Gateway, eu-central-1 | Regional, wildcard certificate of `IsaShared`. Only its base path mapping is in `IsaToolsApp`. |
| Cloudflare CNAMEs `tools-api`, `verify`, `tools` | Cloudflare, slacklineinternational.org | `tools-api` → the custom domain's regional name; `verify` and `tools` → the CloudFront distribution of `IsaToolsApp`. |
| GitHub label `errors:isa-tools` | the monorepo's issues | Created once by hand; the error digest workflow finds its issues by it. |
| SSM `isa-tools-rsa-private-key` | Parameter Store | Signs every certificate and verify token; the public key is in [verificationPublicKey.ts](/isa-tools/server/src/core/documentVerification/verificationPublicKey.ts). Replacing it invalidates every issued document. |
| SSM `isa-tools-google-credentials-json` | Parameter Store | Service account for the Google Sheets. |
| Backup `isa-tools-prod-before-cdk-cutover` | DynamoDB backups | On-demand backup of the documents. |

Names callers outside this repo depend on: the `tools-api` and `tools` domains, the `/v1` endpoints and their scopes, the `verify` URLs in issued QR codes.
