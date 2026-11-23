# Decisions

Each item: the question, the options, a recommendation. Mark your pick by changing **Status** to *Decided: …*. ⭐ = recommended.

## Already given by Can

| # | Decision |
|---|---|
| G1 | Lines only. |
| G2 | A real human (a slackliner) stands behind each live report. |
| G3 | ISA must be technically unable to know who reported. Liability is the reason: "we cannot know", not "we promise not to look". |

---

## D1. What is v1 for?

The [data-access doc](/slackmap/docs/data-access.md) says *no safety-critical use* and names aviation. A pilot feed is safety-critical by design.

| Option | Effect |
|---|---|
| ⭐ A. Community awareness first | Clause stays. Map layer + public live file. Aviation reaches it later only through a partner licence, partner carries the use. |
| B. Aviation feed from day one | Clause is reversed. Liability changes; Swiss law (Art. 100 OR) can't exclude gross negligence anyway. Realistically needs a lawyer. |

Why A: most rigs will never be reported, and "no live line here" shown to a pilot invites false confidence. Ship it as unverified, timestamped community information.

**Status:** open

## D2. How does a report prove "a real member" without identity?

| Option | Proves | ISA can link? | Cost |
|---|---|---|---|
| A. No account, Turnstile only | a human, not a bot | no | lowest; anyone can report, not only slackliners |
| ⭐ B. Blind-signed passes + burner ID on the device | a real ISA member | no, by the maths | medium; standard (Privacy Pass, RFC 9576–9578), libraries exist |
| C. Zero-knowledge group proof (Semaphore-style) | same as B, plus "one per member per line" | no | high; overkill |
| D. Passes handed out by groups or at festivals | someone vouched | no | low tech, heavy organising |
| ✗ E. Burner accounts in the ISA user pool | an email inbox | **yes**: the pool keeps the account; burners get made from the same browser and IP | high; spam route into a pool other apps rely on |

B is your burner idea done so it holds: the burner is a key unlocked by a pass, not an account. See [anonymity](anonymity.md).

**Status:** open

## D3. Who can see live rigs?

| Option | Effect |
|---|---|
| ⭐ A. Everyone, behind the same Turnstile check as the map | Simplest, consistent with today. Land managers and police see rigs too, whoever reported. |
| B. Signed-in users only | Hides rigs from casual readers, not from a determined one with a free account. |
| C. Partners only | No public map layer; defeats the community purpose. |

**Status:** open

## D4. Opt-in attribution?

| Option | Effect |
|---|---|
| ⭐ A. All live reports anonymous | One path. Simplicity principle. |
| B. Anonymous by default, may report as yourself | Named reports could count as more trusted; two paths to build and keep. |

**Status:** open

## D5. Lines not yet on the map

| Option | Effect |
|---|---|
| ⭐ A. Allowed, through the normal add-line flow (two points, length) — then rig it | One path for geometry. The new archive line is created by the burner, so it carries no editor either. |
| B. Only lines already on the map | Simplest, but new lines never get reported live. |

Sub-question: an anonymously created archive line has no editor. Who may edit it later?

**Status:** open

## D6. Who may mark a rig down?

| Option | Effect |
|---|---|
| ⭐ A. Only the burner that rigged it, or expiry. Others' "it's gone" turns it *unconfirmed* | A false "up" costs little; a false "down" can endanger a pilot. Add easily, remove carefully. |
| B. Anyone | Trolls can wipe real obstacles. |

**Status:** open

## D7. Expiry

| Question | Recommendation |
|---|---|
| Take-down time required? | yes |
| Presets | today (default) / weekend / 1 week / custom |
| Maximum | 14 days, extendable |
| After the take-down time | *unconfirmed*; *expired* after 48 h without a "still up" |

**Status:** open

## D8. Lost burner

Phone lost, burner key gone, rig still "up".

| Option | Effect |
|---|---|
| ⭐ A. No recovery; expiry ends it. Optional export as QR or passphrase for crews and second devices | Recovery would need identity. |
| B. Recovery through the ISA account | Breaks G3. |

**Status:** open

## D9. How hard do we hide the IP?

The pass hides *who*; the IP of a request could still point to a household.

| Option | Effect |
|---|---|
| ⭐ A. Never store or log IPs on the anonymous endpoints; don't pass the IP to Turnstile | ISA holds nothing. A court can't force what doesn't exist. |
| B. A plus Oblivious HTTP (RFC 9458) through a third-party relay | ISA never even *sees* the IP. Needs a relay operator. |

**Status:** open

## D10. Pass allowance

How many passes a member gets, and when they're fetched.

| Recommendation | Why |
|---|---|
| e.g. 5 per month, fetched automatically in the background whenever a member is signed in | Caps spam. Fetching ahead breaks the timing link "passes at 14:02, report at 14:03". |

**Status:** open

## Later, not v1

- Pushing to openAIP / paragliding apps / national registers; partner licence for aviation.
- Offering the ~7000 archived highlines as static "possible obstacle" data, arguably more honest for aviation than the live layer.
- Reminders before take-down time (web push).
- Reputation of a burner ("its reports are usually confirmed").

## To check outside the code

- Swiss rule: obstacles above 25 m above ground (outside built-up areas) must be reported to FOCA/BAZL. Does it apply to highlines? Reporting to SlackMap must never be presented as fulfilling it.
- Who maintains the live layer long term (README: contributors stand behind their work).
