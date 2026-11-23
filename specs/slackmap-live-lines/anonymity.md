# Anonymity

## The promise

> **ISA cannot know who reported a live line.** Not by policy: the system never receives it. The code is public, so anyone can verify this.

"Untraceable" is not promised: the place itself can point to a person (locals know who rigs that highline). Users are told so.

## From whom

| Who | What they could get | Needed |
|---|---|---|
| Land managers, police, parks reading the map | the public map | no name or handle shown |
| A court order to ISA (Swiss edition order) | everything stored: table, logs, backups, Drive archives | **nothing identifying ever written** |
| ISA admins, volunteers | table and CloudWatch | same |
| Other users | API, change history | no user id on live data |

Backups (35-day PITR, monthly kept a year, 6-monthly Drive archives) can't be cleaned afterwards, so identity must never reach the table in the first place.

## How the pass works

1. **Signed in**, the phone makes random passes, blinds them (seals each in an envelope) and sends them to ISA.
2. ISA checks the member is under the monthly limit and signs them **without seeing them**. ISA stores only "member X took N passes this month".
3. The phone unblinds them: valid signatures on passes ISA never saw.
4. **Signed out**, the phone spends a pass to create a burner ID (a keypair kept on the device), and spends passes on reports. ISA checks the signature and that the pass is unused.

ISA holds two lists — "member X took 5" and "pass #a91f… was used" — and no maths connects them.

Standards: Privacy Pass (RFC 9576 architecture, 9577 HTTP auth, 9578 issuance), RSA blind signatures (RFC 9474). Libraries exist; nothing invented by us.

## Where identity could still leak

The maths covers only the pass. Each of these needs closing:

| Leak | Close it by |
|---|---|
| **Timing**: passes at 14:02, report at 14:03 | Passes fetched ahead and automatically, e.g. monthly whenever the member is signed in. Never "get a pass now to report". |
| **IP** of the issuing and the reporting request match | Anonymous endpoints never log or store IPs; Turnstile called without `remoteip`. Optionally Oblivious HTTP ([D9](decisions.md#d9-how-hard-do-we-hide-the-ip)). |
| **Login token or cookie** sent with a live call | Anonymous calls come from a separate client context that carries nothing from sign-in. |
| **Rate-limit keys** derived from IP | Hash with a secret rotated daily, so old keys can't be reversed. |
| **Lambda / CloudFront logs** | No body, headers, IP or "coordinates + time" logged on these endpoints. |
| **Change history / editors** | Rigs never write an editor record or a user id into the changelog. |
| **Burner links its own reports** | Accepted: one burner = one pseudonym. A cautious rigger makes a fresh burner per rig (costs one pass). |

## Abuse without identity

| Abuse | Answer |
|---|---|
| Spam / fake rigs | each report costs a pass; passes are capped per member; Turnstile on top |
| Wiping others' rigs | only the burner that rigged it can take it down; others only make it *unconfirmed* |
| Stale "up" | required take-down time and expiry |
| A member farming passes for others | capped per month; low harm since a false "up" is the safe error |

## Licence

The contributor agreement is a click-through and needs no identity: the report carries "terms version X accepted". "A line is up at X at time T" is a fact and mostly can't be owned anyway.

## Legal, best effort (no lawyer)

- Truly anonymous data is not personal data under Swiss and EU data protection law: collecting less is the safer position.
- ISA has no duty to keep logs (not a telecom provider). Not storing is lawful; deleting after an authority asked is not.
- The real liability is aviation, not anonymity: see [D1](decisions.md#d1-what-is-v1-for).
