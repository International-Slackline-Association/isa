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
| G10 | **No fields or UI for consumers' sake** (aviation or other). SlackMap serves slackliners; what others do with the data is not its concern. A rig is: rigged, until when, reported when. |
| G11 | The owner must be able to edit **from any of their devices** (start on the laptop, end on the phone). |
| G12 | **The rig belongs to an anonymous rigger passkey** ([D2](#d2-how-the-owner-edits-from-any-device-without-isa-knowing-who) C), created once with a blind pass. |
| G13 | **No fallback for devices without passkeys** in v1: they see "your device doesn't support anonymous reporting". A second ownership path is added only if real users ask. |
| G14 | **A rig forgets its rigger as soon as it ends** (taken down or expired). ISA never keeps which past rigs came from the same rigger. |
| G15 | **A rigger is deleted after 12 months without an active rig.** Its passkey stops working; the user makes a new rigger with a new pass. Where the browser supports it, the app tells the keychain to drop the dead passkey. |

---

## D1. What is v1 for?

The [data-access doc](/slackmap/docs/data-access.md) says *no safety-critical use* and names aviation. A pilot feed is safety-critical by design.

| Option | Effect |
|---|---|
| ⭐ A. Community awareness first | Clause stays. Aviation reaches it later only through a partner licence, partner carries the use. |
| B. Aviation feed from day one | Clause reversed; liability changes; realistically needs a lawyer. |

Why A: most rigs will never be reported; "no live line here" shown to a pilot invites false confidence.

**Status:** Decided by G10: community only; consumers are not SlackMap's concern. The no-safety-critical-use clause stays.

## D2. How the owner edits from any device without ISA knowing who

G3 + G5 + G11. "Edit with your own ISA account" would mean ISA checks which account owns the rig, so ISA would know: that breaks G3. The owner must hold something ISA can't tie to them, and it must travel between their devices.

| Option | Across devices | ISA can link? | User sees | Cost |
|---|---|---|---|---|
| ✗ A. Own ISA account owns the rig | yes | **yes** | nothing new | lowest; breaks G3 |
| B. Rig key in the browser | **no**; manual QR to move it | no | nothing, until a second device | low |
| ⭐ C. **Anonymous rigger passkey**: an anonymous identity with no email, only a passkey; created once by spending a blind pass | **yes**: passkeys sync through iCloud Keychain / Google Password Manager; a Windows laptop uses the phone by QR | no; its own rigs are linked to each other (one pseudonym) | Face ID / fingerprint prompt to report and edit | medium; standard WebAuthn |
| D. Passkey-derived rig keys (WebAuthn PRF): the passkey yields a secret only the device sees; each rig's key is derived from it | yes | no, not even rigs to each other | same as C | medium-high; PRF support still uneven across browsers |

C is the burner done right: a second identity, but no account to sign in to with email and password, only the device's Face ID.

**Status:** Decided: C, the anonymous rigger passkey. The blind pass is spent once, to create it.

## D3. Who can see live rigs?

| Option | Effect |
|---|---|
| ⭐ A. Everyone, behind the same browser check as the map | Simplest, consistent with today. Land managers and police see rigs too, whoever reported. |
| B. Signed-in users only | Hides from casual readers only. |

**Status:** open

## D4. Does reporting need the ISA sign-in?

The ISA sign-in is needed only to fetch passes, and a pass only to create the anonymous rigger. After that, reporting and editing need only the passkey.

| Option | Effect |
|---|---|
| ⭐ A. Only the first time (to create the rigger); afterwards the passkey alone, signed in or not | Fewer prompts; the two identities never meet in one request. |
| B. Always signed in to ISA as well | Simpler to explain, but both identities sit in the same browser at the same time: more care needed so no request carries both. |

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
| A pass creates an anonymous rigger. E.g. 2 passes per year per member, fetched automatically whenever a member is signed in. Rigs themselves need no pass; a cap on active rigs per rigger (e.g. 5) limits spam. | Caps how many anonymous riggers one member can make; fetching ahead breaks the timing link "pass at 14:02, rigger created at 14:03". |

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
