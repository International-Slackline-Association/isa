---
type: how-to
title: "Usage analytics"
description: "How to answer questions about slackmap usage on demand: the API request log and the CloudFront access logs of data.slackmap.com and images.slackmap.com, their fields, and what they answer with CloudWatch Logs Insights (consumers, countries, networks, routes, signed-in users, errors)."
---

# Usage analytics

## Goal

A usage question answered from the logs, without exploring the code first.

## Where the data is

| Log | Region | What one line is |
|---|---|---|
| `slackmap-prod-cdn-access` | us-east-1 | One CloudFront request to `data.slackmap.com` or `images.slackmap.com`; `x-host-header` says which. |
| The API function's log group (prefix `slackmap-prod-app-ApiFunctionLogs`) | eu-central-1 | One API call, `message = "Request"`; its fields are under `data.` and written in [http.ts](/slackmap/server/src/functions/http.ts). |

Both keep 180 days and hold no IP addresses. `country` and `c-country` come from CloudFront; `asn` is the viewer's network, so a cloud provider's network usually means a script.

## Steps

1. Pick the log and bound the time range.
2. Write a Logs Insights query and run it with `aws logs start-query`. The CDN log is the Infrequent Access class: Logs Insights only, no `filter-log-events`.
3. Field names with parentheses or dashes need backticks; the API line's fields sit under `data.`

## What the logs can answer

- Who reads the map data and photos, and how much: host, referer, user agent and bytes in the CDN log; photo hot-linking shows as a referer outside slackmap.com.
- Outside API consumers: a request with no `origin`, or one outside slackmap.com, is not the web app.
- Scripts and scrapers: a cloud provider's `asn`, or a non-browser user agent.
- Countries over time, route popularity and latency, errors by route, signed-in users (`isaId`) per week.

Counts are approximate: CloudFront delivers its logs best-effort, and calls made straight to the API's `execute-api` address carry no country.
