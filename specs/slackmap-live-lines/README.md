# SlackMap live lines: spec

Status: **discussion**. Nothing is decided unless [decisions](decisions.md) marks it *Decided*. Started 2026-11-23.

## Problem

- SlackMap is an archive: "a line exists here". Nobody reports "this line is rigged **now**".
- Most lines are rigged unofficially. Reporting "it's up now" under an ISA account ties the rigger to it, so nobody does.

## Goal

1. **Live line data.** Riggers broadcast that a line is up, update it, and take it down. Shown on the map, later served to consumers (paragliding apps, aviation obstacle systems).
2. **No association.** A real slackliner stands behind each report, and ISA is **technically unable** to tell who.

Scope: lines only (no spots or guides).

## Proposed shape, in one paragraph

A live report is a **rig** attached to a line, with a required take-down time and an up → unconfirmed → expired life. Reporting is done by an **anonymous rigger ID** (a burner key on the device) that was unlocked with a **blind-signed pass**: proven to come from a real ISA member, unlinkable to which one (IETF Privacy Pass). Live rigs show as their own map layer and ship in a small file refreshed within a minute.

## Files

| File | What it holds |
|---|---|
| [decisions.md](decisions.md) | Every open decision, its options and the recommendation. **Start here.** |
| [flows.md](flows.md) | Flowcharts: the big picture, the rigger's flow, a rig's life, the anonymous pass, the consumers |
| [anonymity.md](anonymity.md) | What we protect from whom, how the pass works, every place identity could leak |
| [live-data.md](live-data.md) | The rig's fields, freshness, consumer formats, aviation facts |

Point-in-time material per the [folder convention](/docs/documentation-system/folder-convention.md#docs-vs-specs): when it is built, the whys go into [slackmap's docs](/slackmap/docs/README.md) and this folder stays a snapshot.
