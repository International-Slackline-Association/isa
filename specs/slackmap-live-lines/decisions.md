# Decisions

Each item: the question, the options, a recommendation. ⭐ = recommended. Change **Status** to *Decided: …* when you pick.

## Decided by Can

| # | Decision |
|---|---|
| G1 | Lines only. |
| G2 | A real human (a slackliner) stands behind each live report. |
| G3 | ISA must be technically unable to know who reported. Liability is the reason: "we cannot know", not "we promise not to look". |
| G4 | **Only lines already on the map can be rigged.** Creating a line stays the normal flow; it says "a line can be rigged here", not that anyone rigged it legally. Rigging is an extension of the line. |
| G5 | **Only whoever holds a rig's manage link can extend it or take it down.** |
| G6 | **A blind-signed pass proves a real member reported** (industry standard, kept simple; also reassuring to users). |
| G7 | **Reminder before expiry = "add to calendar" button + banner on the line card.** Nothing sent by ISA. |
| G8 | **No burner accounts.** Nobody signs in to a second account. |
| G9 | UI: Claude wireframes first from the current app, Can reviews. [Wireframes](wireframes.html). |
| G10 | **No fields or UI for consumers' sake** (aviation or other). SlackMap serves slackliners; what others do with the data is not its concern. A rig is: rigged, until when, reported when. The no-safety-critical-use clause stays. |
| G11 | **Each rig gets a manage link**, kept in the reporter's browser automatically. Sharing it moves the rig to another device *and* hands editing to a crew member: one mechanism for both. No passkeys, no rigger identity, no custom sign-in. |
| G12 | **The link dies when the rig ends** (taken down or expired): its stored hash is erased. |

## Rejected

| Option | Why |
|---|---|
| Own ISA account owns the rig | ISA would know who (breaks G3). |
| Any member can edit any rig | Not owner-only. |
| Burner accounts in the ISA user pool | The pool keeps the account; burners get made from the same browser. |
| Anonymous rigger passkey | Works across devices, but custom sign-in endpoints are an ongoing security burden. Cognito's passkeys need a user account and keep their own sign-in records. |
| Key kept in one browser only | Laptop-to-phone doesn't work. |
| A phrase the user sets once | Forgotten phrases; weak ones can be guessed. |

---

## D1. Link safety

The link is the only key. Who has it can extend or take down that one rig.

| Question | Recommendation |
|---|---|
| Where the code sits in the URL | After `#` (`slackmap.com/line/{id}#manage={code}`): browsers never send it to the server, so it never reaches CloudFront or Lambda logs or a Referer header. The browser sends it in the request body only when acting. |
| Code strength | 128-bit random; ISA stores only a hash. |
| Lost link | No recovery; the rig runs to its expiry. |
| Leaked link | Worst case: someone extends or takes down that one rig. |

**Status:** open

## D2. Who can see live rigs?

| Option | Effect |
|---|---|
| ⭐ A. Everyone, behind the same browser check as the map | Simplest, consistent with today. Land managers and police see rigs too, whoever reported. |
| B. Signed-in users only | Hides from casual readers only. |

**Status:** open

## D3. Expiry

| Question | Recommendation |
|---|---|
| Expiry required? | yes |
| Presets | today (default) / weekend / 1 week / pick a date |
| Maximum | 14 days; link holders can extend |
| At expiry | rig disappears from the map (browser hides it by time); a daily cleanup erases the link hash |
| Banner | from 24 h before expiry, on devices holding the link |

**Status:** open

## D4. Rig history

| Option | Effect |
|---|---|
| ⭐ A. v1 keeps only the current rig on the line | Simplest. |
| B. Keep past rigs ("rigged 12× this year") | Nice, more data and UI. Later. |

**Status:** open

## D5. Pass allowance

| Recommendation | Why |
|---|---|
| Each new rig costs one pass. E.g. 5 passes per month, fetched automatically whenever a member is signed in. Extend and take down cost none (the link proves it). | Caps spam; fetching ahead breaks the timing link "pass at 14:02, rig at 14:03". |

**Status:** open

## D6. How hard do we hide the IP?

| Option | Effect |
|---|---|
| ⭐ A. Never store or log IPs on the rig endpoints; don't pass the IP to Turnstile | ISA holds nothing; a court can't force what doesn't exist. |
| B. A plus Oblivious HTTP (RFC 9458) through a third-party relay | ISA never even sees the IP. Needs a relay operator. |

**Status:** open

## D7. What shows publicly on a rig?

| Field | Recommendation |
|---|---|
| "Rigged", until when | yes |
| Reported how long ago | yes ("reported 2 h ago") |
| Who | **never** |

**Status:** open

## Later, not v1

- Others confirming "still up" / "it's gone".
- Rig history (D4 B).

## To check outside the code

- Swiss rule: obstacles above 25 m above ground (outside built-up areas) reportable to FOCA/BAZL. Applies to highlines? SlackMap must never present reporting a rig as fulfilling it.
- Who maintains the live layer long term (README: contributors stand behind their work).
