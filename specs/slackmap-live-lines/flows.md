# Flows

Diagrams follow the recommendations in [decisions](decisions.md); an open decision can change them.

## 1. Big picture

```mermaid
flowchart LR
    subgraph Rigger["Rigger's phone"]
        Signed["Signed in<br/>(ISA account)"]
        Burner["Anonymous rigger ID<br/>(burner key)"]
    end

    subgraph ISA["SlackMap"]
        Issuer["Pass issuer<br/>sees: member, count"]
        LiveAPI["Live API<br/>sees: valid pass, rig<br/>never: who, IP"]
        Table[("Table<br/>rigs")]
        LiveFile["live.geojson<br/>~1 min fresh"]
    end

    Map["SlackMap map<br/>live layer"]
    Consumers["Later: paragliding apps,<br/>partners"]

    Signed -- "blinded passes" --> Issuer
    Issuer -- "stamped, still sealed" --> Signed
    Signed -. "passes move to the burner,<br/>on the device only" .-> Burner
    Burner -- "rig / update / take down<br/>+ one pass" --> LiveAPI
    LiveAPI --> Table --> LiveFile
    LiveFile --> Map
    LiveFile -.-> Consumers
```

The dotted arrow is the trick: ISA sees both ends but no link between them.

## 2. Rigger: from first time to take down

```mermaid
flowchart TD
    A([Opens SlackMap]) --> B{Has anonymous<br/>rigger ID?}
    B -- no --> C["Signs in with ISA account"]
    C --> D["Passes fetched in background<br/>(already happens monthly)"]
    D --> E["'Create anonymous rigger ID'<br/>spends one pass, key stays on phone"]
    E --> F
    B -- yes --> F["Anonymous mode"]

    F --> G{Line on the map?}
    G -- yes --> H["Line card → 'I rigged this'"]
    G -- no --> I["Add line: two points, length"] --> H
    H --> J["Sheet: height (prefilled),<br/>take down: today ▾,<br/>marked for aircraft? y/n"]
    J --> K(["Rig is live on the map"])

    K --> L{Later}
    L -- still up --> M["'Still up' / 'Extend'"] --> K
    L -- done --> N["'Taken down' — one tap"] --> O([Rig ends])
    L -- forgot --> P["Take-down time passes"] --> Q(["Unconfirmed → expired"])
```

## 3. A rig's life

```mermaid
stateDiagram-v2
    [*] --> Up: rigger reports
    Up --> Up: "still up" (anyone), extend (rigger)
    Up --> Down: rigger takes it down
    Up --> Unconfirmed: take-down time passed
    Up --> Unconfirmed: someone else says "it's gone"
    Unconfirmed --> Up: "still up"
    Unconfirmed --> Down: rigger takes it down
    Unconfirmed --> Expired: 48 h without confirmation
    Down --> [*]
    Expired --> [*]
```

Only the rigger's burner, or time, ends a rig. A stranger's "gone" never removes it.

## 4. The anonymous pass (blind signature)

```mermaid
sequenceDiagram
    autonumber
    participant P as Phone
    participant I as ISA pass issuer
    participant L as ISA live API

    Note over P,I: Signed in, ahead of time (e.g. monthly, automatic)
    P->>P: make 5 random passes, seal each in an "envelope" (blind)
    P->>I: 5 sealed envelopes + ISA login
    I->>I: member under monthly limit? stamp without opening
    I-->>P: 5 stamped envelopes
    P->>P: open envelopes → 5 stamped passes ISA has never seen

    Note over P,L: Later, signed out, separate clean context, no cookies
    P->>L: report rig + one pass
    L->>L: stamp valid? pass not used before?
    L-->>P: ok — ISA knows "a member", not which
```

Same idea as Apple's Private Access Tokens and Cloudflare's Privacy Pass. Details and the leaks to close: [anonymity](anonymity.md).

## 5. Consumers

```mermaid
flowchart LR
    Table[("rigs")] -- "on every change" --> Build["build live.geojson"]
    Cron["expiry job"] -- "up → unconfirmed → expired" --> Table
    Build --> File["data.slackmap.com/live.geojson<br/>Turnstile check, ~1 min cache"]
    File --> Map["SlackMap live layer"]
    File -. later, partner licence .-> Apps["Paragliding apps<br/>(OpenAir / KML)"]
    File -. later .-> AIP["openAIP"]
```

Every output carries: *reported lines only; no line shown ≠ no line there.*
