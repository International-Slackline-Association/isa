---
type: reference
title: "Partner data"
description: "How approved partners fetch the map data with their app client: the scope per stage, /v1/session for the session cookie, the map files at data.slackmap.com including the live file active.geojson and its fields; granting a partner."
---

# Partner data

Approved partners fetch the same map files the map uses, with their app client instead of the browser check. Why and who may: [data access](data-access.md).

## Getting in

1. A token with your app client (client credentials) from `https://auth.slacklineinternational.org/oauth2/token`, with the scope below.
2. `POST /v1/session` with `Authorization: Bearer {token}`. The answer holds `cookieHeader` and `expiresAt`, 12 hours ahead.
3. Fetch files from the data host with `Cookie: {cookieHeader}`. Call `/v1/session` again before `expiresAt`; an app gets at most 24 sessions a day.

| Stage | API | Data host | Scope |
|---|---|---|---|
| prod | `https://api.slackmap.com` | `https://data.slackmap.com` | `slackmap/data.read` |
| test | `https://api.test.slackmap.com` | `https://data.test.slackmap.com` | `slackmap-test/data.read` |

## Files

Under `/geojson/`: `lines/all.geojson`, `spots/all.geojson`, `guides/all.geojson`, their `points.geojson`, and `active.geojson`, the lines and spots rigged right now.

## active.geojson

A GeoJSON `FeatureCollection`, rewritten on every change and at least hourly; drop a feature once its `activeUntil` has passed. Each feature's geometry is the line, or the spot's area; its properties:

| Field | Meaning |
|---|---|
| `id` | The line's or spot's id. |
| `type` | `line` or `spot`. |
| `name` | Its name, or `null`. |
| `lineType` | A line's type, such as `highline`; `null` for a spot. |
| `length`, `height` | A line's metres, or `null`. |
| `country` | ISO 3166-1 alpha-2 code. |
| `activeFrom`, `activeUntil` | When it is rigged, ISO times. |
| `activatedAt` | When it was activated, to the hour. |
| `anonymous` | `true` when activated anonymously; never who. |
| `url` | Its page on SlackMap. |

## Granting a partner

Follow [giving an app access to an ISA service](/docs/engineering/app-access-steps.md) with the scope above.
