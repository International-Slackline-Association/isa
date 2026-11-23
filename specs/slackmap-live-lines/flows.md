# Flows

Two views of the same design: **architecture** (what talks to what, what each part knows) and **user** (what a slackliner does and sees). Decisions behind them: [decisions](decisions.md). Screens: [wireframes](wireframes.html).

---

# Architecture

## A1. Parts and what each one knows

```mermaid
flowchart LR
    subgraph Browser["User's browser"]
        direction TB
        ISACtx["Signed-in requests<br/>ISA login"]
        Passes["Stored passes"]
        Links["Stored manage links"]
        RigCalls["Rig requests<br/>no ISA login, no cookies"]
    end

    Others["Other devices / crew<br/>(link shared by the user)"]

    subgraph ISA["SlackMap backend (existing API Lambda + table)"]
        direction TB
        Issuer["Pass issuer"]
        RigAPI["Rig endpoints<br/>report · extend · take down"]
        Counts[("pass counts<br/>member → n this month")]
        Spent[("spent passes")]
        Lines[("lines<br/>+ rig: until, reported at,<br/>hash of link code")]
        Files["lines/all.geojson<br/>lines/points.geojson<br/>(until, reported at only)"]
    end

    ISACtx -- "sealed passes + login" --> Issuer
    Issuer --> Counts
    Issuer -- "stamped passes" --> Passes
    Passes --> RigCalls
    Links --> RigCalls
    Links -. "share" .-> Others
    Others -. "same rig requests" .-> RigAPI
    RigCalls -- "pass or link code,<br/>never the ISA login" --> RigAPI
    RigAPI --> Spent
    RigAPI --> Lines
    Lines -- "existing stream handler" --> Files
```

| Part | Knows | Never knows |
|---|---|---|
| Pass issuer | member X took n passes this month | which passes |
| Rig endpoints | a valid pass was spent on line L; this code matches L's hash | who, or which member |
| Map files | line is rigged until T, reported at T₀ | anything about the link |
| Server logs | — | the link code: it sits after `#` in the URL, which browsers never send |

The only bridge from "member X" to "rig on line L" is the pass, and the blind signature makes it unrecognisable.

## A2. Passes, in the background

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (signed in)
    participant I as Pass issuer
    Note over B,I: Any time a member is signed in, if fewer than 2 passes are stored
    B->>B: make random passes, seal each (blind)
    B->>I: sealed passes + ISA login
    I->>I: under the monthly limit? count += n
    I-->>B: stamped, still sealed
    B->>B: unseal, store
```

## A3. Report, extend, take down

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (no login on these calls)
    participant R as Rig endpoints
    participant T as Table → map files

    B->>B: make random link code
    B->>R: report line L until T + one pass + hash(code)
    R->>R: pass valid and unused? L exists and not rigged?
    R->>T: L.rig = until T, reported now, hash(code)
    T-->>T: stream handler rewrites map files
    R-->>B: ok
    B->>B: store link slackmap.com/line/L#manage=code

    Note over B,R: Later, from any device holding the link
    B->>R: extend / take down L + code
    R->>R: hash(code) == L.rig.hash?
    R->>T: extend: update until · take down: clear L.rig, hash with it
```

## A4. A rig's life

```mermaid
stateDiagram-v2
    [*] --> Rigged: report (costs one pass)
    Rigged --> Rigged: a link holder extends
    Rigged --> Ended: a link holder takes it down
    Rigged --> Expired: until-time passes, map hides it
    Ended --> [*]: hash erased, link dead
    Expired --> [*]: daily cleanup erases hash, link dead
```

---

# User

## U1. Reporting

```mermaid
flowchart TD
    A([Opens a line on the map]) --> B{Signed in?}
    B -- no --> S["Sign in<br/>(passes arrive quietly)"] --> C
    B -- yes --> C["Taps 'Report rigged'"]
    C --> F{First time?}
    F -- yes --> E["Explainer: reporting is anonymous"] --> Sh
    F -- no --> Sh["Sheet: rigged until  Today ▾"]
    Sh --> D["✓ Rigged until today 20:00<br/>'Add reminder to calendar'<br/>'Share manage link'"]
    D --> M([Line glows on the map for everyone])
```

## U2. Extending or taking down, same device

```mermaid
flowchart TD
    A([Opens the line]) --> O["Card shows Extend / Taken down<br/>(link is in this browser)"]
    O -- Extend --> X["Sheet: until  1 week ▾"]
    O -- Taken down --> T["Confirm"] --> Gone([Line stops glowing])
```

## U3. Another device, or a crew member

```mermaid
flowchart TD
    D["After reporting: 'Share manage link'"] --> Sh["Phone share sheet / copy / QR<br/>to own chat, notes, AirDrop, or a friend"]
    Sh --> Open["Other device opens the link"]
    Open --> Card["Line card with Extend / Taken down<br/>link now stored in that browser too"]
```

No sign-in on the other device. Anyone the link reaches can manage that one rig.

## U4. Reminder and expiry

```mermaid
flowchart TD
    D["Rigged until Sun 20:00"] --> Cal["Saturday 20:00: calendar reminder<br/>(event holds the manage link)"]
    Cal --> O["Opens it: banner 'Expires tomorrow. Still up?'"]
    O -- "Extend" --> X["Sheet: until  1 week ▾"] --> D
    O -- "Taken down" --> End([Gone from the map])
    O -- ignores --> Exp([Sunday 20:00: disappears by itself])
```

## U5. Lost the link

```mermaid
flowchart LR
    Lost["Browser data cleared, link not shared"] --> R["Rig runs until its 'until'<br/>and disappears"]
```

Nobody, including ISA, can recover it: ISA holds only the hash.
