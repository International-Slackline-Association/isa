# Flows

Diagrams follow [decisions](decisions.md); an open decision can change them. Screens: [wireframes](wireframes.html).

## 1. Big picture

```mermaid
flowchart LR
    subgraph Phone["Rigger's phone"]
        Signed["Signed in<br/>(ISA account)"]
        Store["Browser storage:<br/>passes, rig keys"]
    end

    subgraph ISA["SlackMap"]
        Issuer["Pass issuer<br/>sees: member, count"]
        RigAPI["Rig endpoint<br/>sees: valid pass, rig<br/>never: who, IP"]
        Line[("Line record<br/>+ rig fields")]
        File["lines/all.geojson<br/>lines/points.geojson<br/>(existing files)"]
    end

    Map["SlackMap map"]

    Signed -- "blinded passes, with login" --> Issuer
    Issuer -- "stamped, still sealed" --> Store
    Store -- "rig + pass + rig key hash,<br/>no login" --> RigAPI
    RigAPI --> Line -- "existing stream handler" --> File --> Map
```

ISA sees both arrows into it but nothing that links them.

## 2. Rigger

```mermaid
flowchart TD
    A([Opens a line on the map]) --> B{Signed in?}
    B -- no --> S["Sign in"] --> C
    B -- yes --> C{Line already rigged?}
    C -- "yes, by someone else" --> V(["Sees: Rigged until Sat,<br/>reported 2 h ago"])
    C -- "yes, from this phone" --> O["Card shows<br/>Extend / Taken down"]
    C -- no --> R["'Report rigged'"]
    R --> F{First time?}
    F -- yes --> E["One-time explainer:<br/>how anonymous reporting works"] --> Sh
    F -- no --> Sh["Sheet: until (Today ▾),<br/>height (prefilled),<br/>marked for aircraft y/n"]
    Sh --> K["Sent without login, with one pass<br/>+ rig key hash"]
    K --> Done["Rigged ✓<br/>'Add reminder to calendar'"]
    Done --> O
    O -- extend --> O
    O -- "24 h before expiry" --> Ban["Banner: expires tomorrow, extend?"] --> O
    O -- taken down --> End([Rig ends])
    O -- "nothing, time passes" --> Exp([Expires, disappears from map])
```

## 3. A rig's life

```mermaid
stateDiagram-v2
    [*] --> Rigged: owner reports (costs one pass)
    Rigged --> Rigged: owner extends
    Rigged --> Ended: owner takes it down
    Rigged --> Expired: rigged-until passes
    Ended --> [*]
    Expired --> [*]
```

Only the owner's phone (the rig key) or time ends a rig.

## 4. The pass (blind signature)

```mermaid
sequenceDiagram
    autonumber
    participant P as Phone
    participant I as ISA pass issuer
    participant L as ISA rig endpoint

    Note over P,I: Signed in, ahead of time, automatic
    P->>P: make 5 random passes, seal each (blind)
    P->>I: 5 sealed passes + ISA login
    I->>I: under monthly limit? stamp without opening
    I-->>P: 5 stamped, still sealed
    P->>P: unseal → 5 stamped passes ISA has never seen

    Note over P,L: Reporting: no login, no cookies
    P->>P: make rig key, keep it
    P->>L: line id, until, height + one pass + hash(rig key)
    L->>L: stamp valid? pass unused? line not rigged?
    L-->>P: ok

    Note over P,L: Extend / take down
    P->>L: line id + rig key
    L->>L: hash matches?
    L-->>P: ok
```

Details and leaks to close: [anonymity](anonymity.md).
