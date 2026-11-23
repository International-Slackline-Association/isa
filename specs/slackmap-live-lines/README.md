# SlackMap live lines: spec

Status: **discussion**. Nothing is decided unless [decisions](decisions.md) lists it under *Decided by Can*. Started 2026-11-23.

## Problem

- SlackMap is an archive: "a line exists here". Nobody reports "this line is rigged **now**".
- Most lines are rigged unofficially. Reporting "it's up now" under an ISA account ties the rigger to it, so nobody does.

## Goal

1. **Live line data.** Riggers broadcast that a line is up, extend it, and take it down. Shown on the map, later served to consumers (paragliding apps, aviation obstacle systems).
2. **No association.** A real slackliner stands behind each report, and ISA is **technically unable** to tell who.

Scope: lines only, and only lines already on the map.

## The shape, in one paragraph

Rigging is an **extension of an existing line**: a few fields on the line (rigged until, reported at, marked for aircraft), carried in the map's existing line file. A signed-in member reports with one tap; under the hood the report goes out **without the login**, carrying a **blind-signed pass** (proves "a member", not which; IETF Privacy Pass) and the hash of a **rig key** the phone keeps, so only that phone can extend or take it down. Reminders are a calendar event on the phone and a banner on the card; nothing is sent by ISA.

## Files

| File | What it holds |
|---|---|
| [decisions.md](decisions.md) | What's decided, what's open, recommendations. **Start here.** |
| [wireframes.html](wireframes.html) | Phone wireframes of every screen that changes. Open in a browser. |
| [flows.md](flows.md) | Flowcharts: big picture, the rigger's flow, a rig's life, the pass |
| [anonymity.md](anonymity.md) | What we protect from whom, how the pass works, every place identity could leak |
| [live-data.md](live-data.md) | The fields, how they reach the map, consumer formats, aviation facts |

Point-in-time material per the [folder convention](/docs/documentation-system/folder-convention.md#docs-vs-specs): when it is built, the whys go into [slackmap's docs](/slackmap/docs/README.md) and this folder stays a snapshot.
