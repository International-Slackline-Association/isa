# Live data

## A rig, next to a line

A rig is its own record under the line, not a status field on it: a line is rigged many times, the history is useful ("rigged 12× this year"), and the archive line keeps its own editors and history untouched.

| Field | Why |
|---|---|
| line it belongs to (two endpoints come from it) | geometry |
| max height above ground, prefilled from the line | obstacle height |
| rigged at | |
| take-down time, required | expiry |
| status: up / unconfirmed / down / expired | |
| marked for aircraft (balls, flags): yes / no | visibility from the air |
| last confirmed at, and by whom: rigger / passer-by | trust signal |
| burner public key (not a user id) | who may update or take down |
| terms version accepted | licence |

Later, not v1: anchor elevation above sea level (aviation needs it; derivable from a terrain model), photos, notes, multiple lines in one rig.

## Freshness

- The map's line file is rebuilt in batch. Live data can't ride on it.
- A separate small `live.geojson`, rebuilt on every rig change (the table's change stream), cached about a minute. For aviation, minutes are fine, hours are not.
- An expiry job moves rigs up → unconfirmed → expired.

## Map

- Own layer, always on, above archive lines: bright red/orange, subtle pulse. Unconfirmed: dashed or faded.
- "N lines rigged now" toggle.
- Line card: "I rigged this" or, when live, "Still up / Extend / Taken down".

## Consumers, later

| Consumer | Format | Note |
|---|---|---|
| SlackMap map | our GeoJSON | the source of truth |
| Paragliding apps (XCTrack, SeeYou, XCSoar) | OpenAir or KML derived from it | XCTrack has an open request for cable files |
| openAIP (aggregator many apps pull from) | KML/KMZ obstacle import | whether line obstacles are accepted and exposed is unconfirmed |
| National registers (Swiss BAZL: AIXM, KML, CSV) | — | **not live**: validated datasets on 28-day cycles; temporary obstacles reach pilots only by NOTAM. A live feed doesn't fit them. |
| FLARM-style warning databases | — | possible partner |

Every output says: *reported lines only; no line shown ≠ no line there.*

## Aviation facts to verify

- Switzerland: cables above 25 m above ground outside built-up areas are reportable to FOCA/BAZL (60 m in some guidelines). Unconfirmed for highlines.
- ISA already writes about [highlines as obstacles](https://www.slacklineinternational.org/highlines_airspace/).
- Sources: [BAZL air navigation obstacles](https://www.bazl.admin.ch/en/air-navigation-obstacles), [Swiss obstacle data](https://opendata.swiss/en/dataset/luftfahrthindernisdaten-schweiz), [openAIP obstacle import](https://manager.airnavigation.aero/docs/obstacles.html), [XCTrack cable request](https://gitlab.com/xcontest-public/xctrack-public/issues/172), [OpenAir format](https://github.com/naviter/seeyou_file_formats/blob/main/OpenAir_File_Format_Support.md), [FLARM obstacles](https://flarm.com/en/general-aviation/obstacle-warning-system).
