---
type: index
title: "SlackMap"
description: "Entry point for slackmap: the world slackline map at slackmap.com, its API at api.slackmap.com, map data at data.slackmap.com and images at images.slackmap.com, with its CDK infra."
nav: { order: 40 }
---

# SlackMap

The world slackline map at `slackmap.com`: slackliners document their lines, spots and guides. Its API at `api.slackmap.com`, the map's geojson at `data.slackmap.com`, images at `images.slackmap.com`. Sign-in is the ISA account, from [isa-users](/isa-users/docs/README.md).

## Read when

- Before any change: [the vision](/slackmap/README.md): simplicity is the first principle
- Running locally or deploying: [operating](operating.md)
- What is set up by hand and what other apps rely on: [manual operations](manual-operations.md)
- Querying or adding to the table: [table design](table-design.md)
- What is open: [notes](notes.md)

## From higher scopes

- [Infrastructure rules](/docs/engineering/infrastructure.md): the CDK shape and names `infra/` follows
- [Why one monorepo](/docs/the-monorepo.md): the map data is critical data
