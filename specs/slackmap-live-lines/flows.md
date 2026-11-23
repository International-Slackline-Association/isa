# Flows

Two views of the same design: **architecture** (what talks to what, what each part knows) and **user** (what a slackliner does and sees). Decisions behind them: [decisions](decisions.md). Screens: [wireframes](wireframes.html).

---

# Architecture

## A1. Parts and what each one knows

```mermaid
flowchart LR
    subgraph Device["User's devices"]
        direction TB
        subgraph Browser["Browser"]
            ISACtx["ISA context<br/>ISA login"]
            AnonCtx["Anonymous context<br/>rigger session<br/>no ISA login, no cookies"]
            Passes["Stored passes"]
        end
        Keychain["Passkey store<br/>iCloud Keychain / Google PM<br/>synced across own devices"]
    end

    subgraph ISA["SlackMap backend"]
        direction TB
        Cognito["isa-users<br/>(ISA sign-in)"]
        Issuer["Pass issuer"]
        RiggerAPI["Rigger API<br/>register · sign in · rig"]
        subgraph Table["Table"]
            Counts[("pass counts<br/>member → n this year")]
            Spent[("spent passes")]
            Riggers[("anonymous riggers<br/>id → passkey public key")]
            Lines[("lines<br/>+ rig: until, reported at, rigger id")]
        end
        Files["lines/all.geojson<br/>lines/points.geojson<br/>(until, reported at only)"]
    end

    ISACtx -- login --> Cognito
    ISACtx -- "sealed passes + login" --> Issuer
    Issuer --> Counts
    Issuer -- "stamped passes" --> Passes
    Passes --> AnonCtx
    Keychain <-->|Face ID| AnonCtx
    AnonCtx -- "pass, passkey, rigs<br/>never the ISA login" --> RiggerAPI
    RiggerAPI --> Spent
    RiggerAPI --> Riggers
    RiggerAPI --> Lines
    Lines -- "existing stream handler" --> Files
```

| Part | Knows | Never knows |
|---|---|---|
| Pass issuer | member X took n passes this year | which passes, which rigger |
| Rigger API | a valid pass was spent; rigger R owns rigs 1, 2, 3 | which member R is |
| Map files | line is rigged until T, reported at T₀ | any rigger id |
| Apple / Google | a passkey for slackmap.com exists on this person's devices | its contents (end-to-end encrypted) |

The one bridge between the left and right columns of ISA's knowledge is the stored pass, and the blind signature makes it unrecognisable.

## A2. Passes, in the background

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (ISA context)
    participant I as Pass issuer
    Note over B,I: Any time a member is signed in, if fewer than 2 passes are stored
    B->>B: make random passes, seal each (blind)
    B->>I: sealed passes + ISA login
    I->>I: under the yearly limit? count += n
    I-->>B: stamped, still sealed
    B->>B: unseal, store
```

## A3. Creating the anonymous rigger (once)

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (anonymous context)
    participant K as Passkey store
    participant R as Rigger API
    B->>R: start registration
    R-->>B: challenge, random rigger id
    B->>K: create passkey "SlackMap anonymous rigger"
    K-->>B: Face ID ✓, public key
    B->>R: public key + one stored pass
    R->>R: pass stamp valid? not spent? mark spent, save rigger
    R-->>B: rigger session
```

## A4. Reporting, extending, taking down

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser (anonymous context)
    participant K as Passkey store
    participant R as Rigger API
    participant T as Table → map files
    alt no rigger session on this device yet
        B->>R: sign-in challenge
        B->>K: sign challenge
        K-->>B: Face ID ✓
        B->>R: signature
        R-->>B: rigger session
    end
    B->>R: report line L rigged until T
    R->>R: L exists? not rigged? rigger under active-rig cap?
    R->>T: L.rig = until T, reported now, rigger R
    T-->>T: stream handler rewrites map files
    B->>R: extend / take down L
    R->>R: L.rig.rigger == R?
    R->>T: update or clear L.rig
```

## A5. A rig's life

```mermaid
stateDiagram-v2
    [*] --> Rigged: rigger reports
    Rigged --> Rigged: rigger extends
    Rigged --> Ended: rigger takes it down
    Rigged --> Expired: until-time passes, map hides it
    Ended --> [*]
    Expired --> [*]
```

---

# User

## U1. First report

```mermaid
flowchart TD
    A([Opens a line on the map]) --> B{Signed in to SlackMap?}
    B -- no --> S["Sign in<br/>(passes arrive quietly)"] --> C
    B -- yes --> C["Taps 'Report rigged'"]
    C --> E["Explainer: reporting is anonymous<br/>'Got it'"]
    E --> P["Phone asks: save a passkey<br/>'SlackMap anonymous rigger'?<br/>Face ID"]
    P --> Sh["Sheet: rigged until  Today ▾"]
    Sh --> D["✓ Rigged until today 20:00<br/>'Add reminder to calendar'"]
    D --> M([Line glows on the map for everyone])
```

## U2. Every report after that

```mermaid
flowchart TD
    A([Opens a line]) --> C["Taps 'Report rigged'"]
    C --> F{This device already<br/>used the passkey recently?}
    F -- no --> P["Face ID"] --> Sh
    F -- yes --> Sh["Sheet: until  Today ▾"]
    Sh --> D["✓ Rigged · calendar reminder"]
```

No ISA sign-in needed ([D4](decisions.md#d4-does-reporting-need-the-isa-sign-in)).

## U3. Rigged on the laptop, taken down from the phone

```mermaid
flowchart TD
    L["Laptop: reports the line rigged<br/>(passkey saved to iCloud / Google)"] --> Sync[["Passkey syncs to the phone<br/>by itself"]]
    Sync --> O["Phone, two days later: opens the line"]
    O --> Q{Phone has a rigger session?}
    Q -- no --> Btn["Card shows 'Rigged until Sun'<br/>+ 'Is this yours? Manage'"]
    Btn --> F["Face ID"] --> Own
    Q -- yes --> Own["Card shows Extend / Taken down"]
    Own --> T["Taps 'Taken down' → confirm"]
    T --> Gone([Line stops glowing])

    W["Windows laptop without the passkey"] -.-> QR["Browser shows a QR code<br/>scan with the phone, Face ID there"] -.-> Own
```

The "Is this yours? Manage" link replaces asking the server who owns a rig: the device proves it with Face ID, otherwise nothing is revealed.

## U4. Reminder and expiry

```mermaid
flowchart TD
    D["Rigged until Sun 20:00"] --> Cal["Saturday 20:00: calendar reminder on the phone<br/>(set at report time)"]
    Cal --> O["Opens the line: banner 'Expires tomorrow. Still up?'"]
    O -- "Extend" --> X["Sheet: until  1 week ▾"] --> D
    O -- "Taken down" --> End([Gone from the map])
    O -- ignores --> Exp([Sunday 20:00: disappears by itself])
```

## U5. Lost every device

```mermaid
flowchart LR
    Lost["Phone and laptop gone,<br/>passkey not synced anywhere"] --> R["Rigs run until their 'until'<br/>and disappear"]
    R --> New["Next time: sign in, get a pass,<br/>create a new anonymous rigger"]
```

Nobody, including ISA, can recover the old rigger: that is the point.
