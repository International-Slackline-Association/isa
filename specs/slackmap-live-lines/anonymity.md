# Anonymity

## The promise

> **ISA cannot know who reported a rig.** Not by policy: the system never receives it. The code is public, so anyone can verify this.

"Untraceable" is not promised: the place itself can point to a person (locals know who rigs that highline). Users are told so.

## From whom

| Who | What they could get | Needed |
|---|---|---|
| Land managers, police, parks reading the map | the public map | no name shown |
| A court order to ISA (Swiss edition order) | everything stored: table, logs, backups, Drive archives | **nothing identifying ever written** |
| ISA admins, volunteers | table and CloudWatch | same |
| Other users | API, change history | no user id on rig data |

Backups (35-day PITR, monthly kept a year, 6-monthly Drive archives) can't be cleaned afterwards, so identity must never reach the table.

## Two things the user holds

| Thing | Proves | Made when | User sees |
|---|---|---|---|
| **Pass** (blind-signed) | "a real member reported this", not which | fetched ahead, automatically, while signed in; one per rig | nothing |
| **Manage link** | "I may change this rig" | when reporting; ISA keeps only a hash of its code | a link they can share |

## How the pass works

1. **Signed in**, the browser makes random passes, blinds them (seals each) and sends them with the login.
2. ISA checks the member is under the monthly limit and signs them **without seeing them**. ISA stores only "member X took N passes this month", no time.
3. The browser unseals them: valid signatures on passes ISA never saw.
4. **Reporting**, without login, the browser sends one pass. ISA checks the signature and that the pass is unused.

ISA holds "member X took 5" and "pass #a91f… was spent on line L", and no maths connects them.

Standard: Privacy Pass (RFC 9576 architecture, 9578 issuance) with RSA blind signatures (RFC 9474). Simplest deployment: ISA is both issuer and verifier. Cloudflare publishes TypeScript implementations (`@cloudflare/privacypass-ts`, `@cloudflare/blindrsa-ts`), to verify before choosing.

## How the link works

- `slackmap.com/line/{id}#manage={code}`: a 128-bit random code after `#`. Browsers never send what follows `#` to the server, so the code never appears in CloudFront or Lambda logs, or in a Referer header.
- The browser sends the code in the request body only when extending or taking down. ISA compares its hash and never stores the code.
- The hash is erased when the rig ends, so the link dies with it.
- Whoever holds the link can manage that one rig. Sharing it is how the rigger moves to another device or hands over to a crew member.

## Where identity could still leak

| Leak | Close it by |
|---|---|
| **Timing**: pass at 14:02, rig at 14:03 | Passes fetched ahead and automatically on any sign-in; pass counts stored without time. |
| **IP** of signed-in and rig requests match | Rig endpoints never log or store IPs; Turnstile called without `remoteip`. Optionally Oblivious HTTP ([D6](decisions.md#d6-how-hard-do-we-hide-the-ip)). |
| **Login token** sent with a rig request | Rig requests go through a client that carries no ISA login. |
| **The browser-check session cookie** ([data access](/slackmap/docs/data-access.md)) sent with both signed-in and rig requests | Rig endpoints don't log or store it with the rig, or rig requests get their own browser-check session. To settle in the deep dive. |
| **Rate-limit keys** derived from IP | Hash with a secret rotated daily. |
| **Lambda / CloudFront logs** | No body, headers or IP logged on rig endpoints. |
| **Line changelog / editors** | Rig fields never write an editor record or a changelog entry with a user id. Line edits and rig changes are separate paths. |
| **Where the user shares the link** | Their choice (their own chat, a friend). Outside ISA. |

## Abuse without identity

| Abuse | Answer |
|---|---|
| Spam / fake rigs | each rig costs a pass; passes capped per member; Turnstile on top |
| Taking down others' rigs | needs their link |
| A shared link gets passed further | worst case: that one rig is extended or taken down |
| Stale "rigged" | required expiry; reminder on the owner's calendar |

## Licence

The report carries "terms version X accepted"; it needs no identity. "A line is rigged at X until T" is a fact and mostly can't be owned anyway.

## Legal, best effort (no lawyer)

- Truly anonymous data is not personal data under Swiss and EU data protection law.
- ISA has no duty to keep logs (not a telecom provider). Not storing is lawful; deleting after an authority asked is not.
