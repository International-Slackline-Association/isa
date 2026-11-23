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

## Two things on the phone

| Thing | Proves | Made when |
|---|---|---|
| **Pass** (blind-signed) | "a real member sent this", not which | fetched ahead, automatically, while signed in |
| **Rig key** (random) | "I'm whoever reported this rig" | when reporting; ISA keeps only its hash |

Neither carries identity. The user sees neither.

## How the pass works

1. **Signed in**, the phone makes random passes, blinds them (seals each) and sends them with the login.
2. ISA checks the member is under the monthly limit and signs them **without seeing them**. ISA stores only "member X took N passes this month".
3. The phone unseals them: valid signatures on passes ISA never saw.
4. **Reporting**, without login, the phone sends one pass. ISA checks the signature and that the pass is unused.

ISA holds "member X took 5" and "pass #a91f… was used", and no maths connects them.

Standard: Privacy Pass (RFC 9576 architecture, 9578 issuance) with RSA blind signatures (RFC 9474). Simplest deployment: ISA is both issuer and verifier. Cloudflare publishes TypeScript implementations (`@cloudflare/privacypass-ts`, `@cloudflare/blindrsa-ts`), to verify before choosing.

## Where identity could still leak

| Leak | Close it by |
|---|---|
| **Timing**: passes at 14:02, report at 14:03 | Passes fetched ahead and automatically. Never "get a pass now to report". |
| **IP** of the issuing and reporting requests match | Rig endpoint never logs or stores IPs; Turnstile called without `remoteip`. Optionally Oblivious HTTP ([D8](decisions.md#d8-how-hard-do-we-hide-the-ip)). |
| **Login token or cookie** sent with the report | Rig calls go through a client that carries nothing from sign-in. |
| **Rate-limit keys** derived from IP | Hash with a secret rotated daily. |
| **Lambda / CloudFront logs** | No body, headers, IP on this endpoint. |
| **Line changelog / editors** | Rig fields never write an editor record or a changelog entry with a user id. Line edits and rig updates are separate paths. |
| **"Is this my rig?"** | Decided in the browser (rig key in storage), never asked of the server while signed in. |

## Abuse without identity

| Abuse | Answer |
|---|---|
| Spam / fake rigs | each new rig costs a pass; passes capped per member; Turnstile on top |
| Taking down others' rigs | impossible: needs the rig key |
| Stale "rigged" | required expiry; reminder on the owner's phone |
| A fake rig blocks the line until expiry | max 14 days; whether others can flag it is for later |

## Licence

The report carries "terms version X accepted"; it needs no identity. "A line is rigged at X until T" is a fact and mostly can't be owned anyway.

## Legal, best effort (no lawyer)

- Truly anonymous data is not personal data under Swiss and EU data protection law.
- ISA has no duty to keep logs (not a telecom provider). Not storing is lawful; deleting after an authority asked is not.
- The real liability is aviation, not anonymity: [D1](decisions.md#d1-what-is-v1-for).
