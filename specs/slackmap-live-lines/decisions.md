# Decisions

Each item: the question, the options, a recommendation. ⭐ = recommended. Change **Status** to *Decided: …* when you pick.

## Decided by Can

| # | Decision |
|---|---|
| G1 | Lines only. |
| G2 | A real human (a slackliner) stands behind each live report. |
| G3 | ISA must be technically unable to know who reported. Liability is the reason: "we cannot know", not "we promise not to look". |
| G4 | **Only lines already on the map can be rigged.** Creating a line stays the normal flow; it says "a line can be rigged here", not that anyone rigged it legally. Rigging is an extension of the line. |
| G5 | **Only whoever first reported a rig can update or take it down.** Nobody else, and no code to share by hand. |
| G6 | **Anonymity uses a blind-signed pass** (industry standard, kept simple). A pass is also reassuring to users: something they can read about. |
| G7 | **Reminder before expiry = "add to calendar" button + banner on the line card.** Nothing sent by ISA. |
| G8 | **No burner accounts.** Nobody signs in to a second account. |
| G9 | UI: Claude wireframes first from the current app, Can reviews. [Wireframes](wireframes.html). |

---

## D1. What is v1 for?

The [data-access doc](/slackmap/docs/data-access.md) says *no safety-critical use* and names aviation. A pilot feed is safety-critical by design.

| Option | Effect |
|---|---|
| ⭐ A. Community awareness first | Clause stays. Aviation reaches it later only through a partner licence, partner carries the use. |
| B. Aviation feed from day one | Clause reversed; liability changes; realistically needs a lawyer. |

Why A: most rigs will never be reported; "no live line here" shown to a pilot invites false confidence.

**Status:** open

## D2. How owner-only works without identity

G3 + G5: ISA can't know who the owner is, so the owner must hold something. It can be invisible.

| Option | Effect |
|---|---|
| ⭐ A. A random **rig key** made by the phone when reporting, kept in the browser; ISA stores only its hash | User never sees it. Update / take down from that phone just works. Another phone can't. |
| B. A as default, plus "move to another phone" as a QR | For crews or a second device. More UI. |

Sub-question: phone lost or browser data cleared → the rig can't be ended by anyone and runs to its expiry. Acceptable?

**Status:** open

## D3. Who can see live rigs?

| Option | Effect |
|---|---|
| ⭐ A. Everyone, behind the same browser check as the map | Simplest, consistent with today. Land managers and police see rigs too, whoever reported. |
| B. Signed-in users only | Hides from casual readers only. |

**Status:** open

## D4. Can someone report while signed out?

The pass is fetched while signed in; reporting itself needs no login.

| Option | Effect |
|---|---|
| ⭐ A. Must be signed in to report (passes fetched in the background then) | One flow. The report itself still goes out without the login. |
| B. A member with passes left may report while signed out | Same security, more states to explain. |

**Status:** open

## D5. Expiry

| Question | Recommendation |
|---|---|
| Expiry required? | yes |
| Presets | today (default) / weekend / 1 week / pick a date |
| Maximum | 14 days; owner can extend |
| At expiry | rig disappears from the map (browser hides it by time; no job needed) |
| Banner | from 24 h before expiry, to the owner's phone only |

**Status:** open

## D6. Rig history

| Option | Effect |
|---|---|
| ⭐ A. v1 keeps only the current rig on the line | Simplest. |
| B. Keep past rigs ("rigged 12× this year") | Nice, more data and UI. Later. |

**Status:** open

## D7. Pass allowance

| Recommendation | Why |
|---|---|
| e.g. 5 passes per month, fetched automatically whenever a member is signed in; each new rig costs one; extend and take down cost none (the rig key proves it) | Caps spam; fetching ahead breaks the timing link "passes at 14:02, report at 14:03". |

**Status:** open

## D8. How hard do we hide the IP?

| Option | Effect |
|---|---|
| ⭐ A. Never store or log IPs on the anonymous endpoint; don't pass the IP to Turnstile | ISA holds nothing; a court can't force what doesn't exist. |
| B. A plus Oblivious HTTP (RFC 9458) through a third-party relay | ISA never even sees the IP. Needs a relay operator. |

**Status:** open

## D9. What shows publicly on a rig?

| Field | Recommendation |
|---|---|
| "Rigged", until when | yes |
| Reported how long ago | yes ("reported 2 h ago") |
| Marked for aircraft y/n | yes |
| Who | **never** |

**Status:** open

## Later, not v1

- Pushing to openAIP / paragliding apps / national registers; partner licence for aviation.
- Offering the ~7000 archived highlines as static "possible obstacle" data.
- Others confirming "still up" / "it's gone".
- Rig history (D6 B).

## To check outside the code

- Swiss rule: obstacles above 25 m above ground (outside built-up areas) reportable to FOCA/BAZL. Applies to highlines? Reporting to SlackMap must never be presented as fulfilling it.
- Who maintains the live layer long term (README: contributors stand behind their work).
