# Implementation plan

From reading the code on `main` (with the test stage). Open points are marked **Q** and listed in [the open questions](#open-questions); everything else follows the existing patterns.

## Findings that shape the plan

| Finding | Where | Consequence |
|---|---|---|
| **The API request log stores `isaId`, user agent, ASN, country and time on every call, for 180 days.** SlackMap traffic is low, so "who was signed in during the minute this rig was reported" is often one person. | [http.ts](/slackmap/server/src/functions/http.ts), [usage analytics](/slackmap/docs/usage-analytics.md) | Breaks G3 on its own, whatever the rig endpoints do. **Q1.** |
| Line edits replace the whole line item (`get` → merge → `put`) and write a changelog | [line api](/slackmap/server/src/functions/api/endpoints/line/api.ts) | Rig fields on the line item would race with edits and bump "Last updated". **Q2.** |
| The table has TTL (`ddb_ttl`) and a stream | [data-stack.ts](/slackmap/infra/lib/data-stack.ts) | A rig item with a TTL deletes itself after expiry; the stream then refreshes the map. No cleanup job. |
| Line map files are patched per change by reading and rewriting S3; parallel changes can lose one (groups were switched to full rebuilds for this) | [geojson](/slackmap/server/src/core/features/geojson/index.ts) | A lost rig change shows a stale rig on the map until the next change, the weekly rebuild or its expiry. The card is always right. **Q5.** |
| `requireAgreement` gates signed-in writes on the contributor agreement | [me api](/slackmap/server/src/functions/api/endpoints/me/api.ts) | Gate **pass issuance** with it: every pass comes from a member who accepted the licence, so a report carries no licence step. |
| No API Gateway access logs; CloudFront logs cover only data and images, without IPs | [app-stack.ts](/slackmap/infra/lib/app-stack.ts), [cdn-logs-stack.ts](/slackmap/infra/lib/cdn-logs-stack.ts) | The request log line is the only per-call record to fix. |
| The browser-check session counter stores only a hash of the cookie and a call count | [session](/slackmap/server/src/core/features/session/index.ts) | Sharing one session cookie between signed-in and rig calls stores no link. No change. |
| isa-users has no Cognito threat protection | [isa-users infra](/isa-users/infra/lib) | Cognito keeps no per-sign-in history in the pool. CloudTrail still records sign-in calls for 90 days (residual, **Q6**). |
| Secrets are SSM parameters set by hand per stage, passed as Lambda env | [config.ts](/slackmap/infra/lib/config.ts) | The pass signing key follows the session signing key's pattern. KMS can't make blind signatures. |
| Lambda and web run Node 24 | | `@cloudflare/blindrsa-ts` needs Node ≥ 24. |

## Library

`@cloudflare/blindrsa-ts` 0.4.6 (RFC 9474 RSA blind signatures): Apache-2.0, Cloudflare-maintained, last release June 2026, one dependency (`sjcl`). It runs both in the browser (blind, unblind) and in Lambda (sign, verify). Not the full `privacypass-ts`: six dependencies for an HTTP auth scheme we don't need. **Q3.**

## Data

| Item | PK | SK_GSI | GSI_SK | Fields | TTL |
|---|---|---|---|---|---|
| Rig (**Q2**) | `line:{id}` | `lineRig` | `line:{id}` | `until`, `reportedAt` (rounded, **Q4**), `linkHash` | `until` + 2 days |
| Pass count | `user:{isaId}` | `passCount:{yyyy-mm}` | | `count` | end of next month |
| Spent pass | `pass:{hash}` | `spentPass` | | | none (tiny; kept while the key is valid) |

- One active rig per line. A second report on a rigged line is refused.
- Deleting a line deletes its rig (the existing line REMOVE handler).
- The full rebuild (weekly job) queries the GSI `SK_GSI = lineRig` once instead of reading each line's rig.

## Server

| Piece | What |
|---|---|
| `core/features/rig` | rig entity, link-hash check, pass verify / spend, pass count |
| `POST /passes` | signed in + `requireAgreement`; takes blinded messages, returns blind signatures; refuses over 5 per month |
| `POST /line/:id/rig` | no login used; body `until`, pass (token + signature), `linkHash`; checks pass, line exists, not rigged, `until` ≤ 14 days |
| `PUT /line/:id/rig` | body `until`, `code`; hash must match |
| `DELETE /line/:id/rig` | body `code`; hash must match; deletes the item |
| `GET /line/:id/details` | adds `rig: { until, reportedAt }`; never the hash |
| Stream handler | rig INSERT / MODIFY / REMOVE → `refreshLineGeoJsonFiles` for that line |
| `processLineGeoJson` | adds `ru` (until) and `ra` (reported at) to the line's features when rigged |
| Logging | rig routes log action, line id and outcome; never user agent, ASN, country, origin or IP (**Q1** for the rest) |

The rig routes sit outside `lineRoutes`, so the agreement wrapper and editor checks never touch them.

## Web

| Piece | What |
|---|---|
| Pass wallet | when signed in and fewer than 2 passes are stored: blind, request, unblind, store in `localStorage`. Loaded lazily (blind-RSA code only when needed) |
| Rig client | plain `fetch` with the session cookie and **no `Authorization` header**; separate from the RTK base query that adds the login |
| Manage links | `localStorage` by line id. Opening `/line/{id}#manage={code}` stores the code and strips the fragment from the address bar |
| Line card | rig block: "Report rigged" / rigged status / Extend, Taken down, Share manage link / 24 h banner |
| Dialogs | one-time explainer, until sheet, done dialog (calendar `.ics` with the link, share sheet / copy), extend sheet, take-down confirm (existing confirm dialog) |
| Map | rigged style on lines and points; layer filter hides `ru` in the past; "Rigged now" display option; legend count |
| After a change | the card refetches; the map file is refetched a few seconds later (the stream rewrites it) |
| FAQ | one entry: how anonymous reporting works |

Map look: variant A (red line, orange halo, LIVE tag) unless you choose B.

## Infra and operations

- SSM parameter `slackmap-pass-signing-key` per stage, set by hand like the session key; its public key in [web stages](/slackmap/web/src/stages.ts). Rotating it invalidates unspent passes; browsers fetch new ones.
- No new AWS resource.

## Docs, at the end

- New slackmap explanation: live lines, the anonymity promise and its whys (in Can's words from this session).
- [table design](/slackmap/docs/table-design.md): the three items.
- [usage analytics](/slackmap/docs/usage-analytics.md): per **Q1**.
- [manual operations](/slackmap/docs/manual-operations.md): the signing key parameter.
- [data access](/slackmap/docs/data-access.md): rigs are in the map file under the same gate.

## Verification

Locally (`dev` against the test stage API after deploy), then on `test.slackmap.com`: report, extend, take down, share link to a second browser, expiry by a short `until`, the explainer, calendar file, and the request log lines of rig calls carrying no identity.

## Open questions

| # | Question | Recommendation |
|---|---|---|
| Q1 | **The request log's `isaId`.** Keep it and anonymity is broken by timing. | Drop `isaId` from all log lines (request and error); log `signedIn: true/false`. Loses "signed-in users per week"; that analytics line changes. |
| Q2 | **Rig as its own item** under the line, not fields on the line item. A new noun in the table. | Own item: no race with line edits, no changelog or "Last updated" noise, TTL does the cleanup. Still "an extension of the line": same PK, shown on the line. |
| Q3 | **New dependency** `@cloudflare/blindrsa-ts` (+ `sjcl`). | Add it. |
| Q4 | **Precision of the public "reported at".** | Round to the hour. Cuts matching a report to anything timed elsewhere. |
| Q5 | **Map file lost update** on parallel changes (existing for lines; rigs add writes). | Accept for v1: card always right; expiry, the next change or the weekly rebuild repairs the map. |
| Q6 | **Residual: CloudTrail keeps Cognito sign-in calls 90 days** (time, IP). A first-time user who signs in and reports minutes later is weakly linkable by someone with AWS account access. | Accept and say it in the doc. Passes are fetched at sign-in, so a report right after a first sign-in is the only case. |
| Q7 | A fake rig blocks the line for others until its expiry (max 14 days). | Accept for v1. |
