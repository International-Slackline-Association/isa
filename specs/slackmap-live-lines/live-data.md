# Live data

## Rig fields on the line

Rigging extends an existing line ([G4](decisions.md#decided-by-can)): a few fields on the line record, no new entity in v1.

| Field | In the map file | Why |
|---|---|---|
| rigged until | yes | expiry; the browser hides the rig once it passes |
| reported at | yes | "reported 2 h ago" |
| owner proof (rig key hash or rigger id, per [D2](decisions.md#d2-how-the-owner-edits-from-any-device-without-isa-knowing-who)) | **never** | owner-only update |
| terms version accepted | no | licence |

Nothing else ([G10](decisions.md#decided-by-can)).

## How it reaches the map

- The map loads `lines/all.geojson` and `lines/points.geojson` from data.slackmap.com. They are **rewritten on every line change** by the stream handler ([lineHandler.ts](/slackmap/server/src/functions/ddb-streams/lineHandler.ts)) and refreshed weekly; CloudFront doesn't cache them.
- So a rig is a few short properties on the line's feature in those same files, e.g. `ru` (rigged until) and `ra` (reported at). No new endpoint, no new file.
- The stream handler today refreshes only when the geometry changes; it must also refresh when rig fields change.
- The browser loads the file once per visit; the line card fetches fresh details, so the card is always current and the map is current to the page load.
- Expiry needs no job: the map filter hides features whose `ru` is in the past. The record keeps the old value until the next write.

## Consumers, later

| Consumer | Format | Note |
|---|---|---|
| SlackMap map | our GeoJSON | the source of truth |
| Paragliding apps (XCTrack, SeeYou, XCSoar) | OpenAir or KML derived from it | XCTrack has an open request for cable files |
| openAIP (aggregator many apps pull from) | KML/KMZ obstacle import | whether line obstacles are accepted and exposed is unconfirmed |
| National registers (Swiss BAZL: AIXM, KML, CSV) | — | **not live**: validated datasets on 28-day cycles; temporary obstacles reach pilots only by NOTAM |
| FLARM-style warning databases | — | possible partner |

Every output says: *reported lines only; no line shown ≠ no line there.*

## Aviation facts to verify

- Switzerland: cables above 25 m above ground outside built-up areas are reportable to FOCA/BAZL (60 m in some guidelines). Unconfirmed for highlines.
- ISA already writes about [highlines as obstacles](https://www.slacklineinternational.org/highlines_airspace/).
- Sources: [BAZL air navigation obstacles](https://www.bazl.admin.ch/en/air-navigation-obstacles), [Swiss obstacle data](https://opendata.swiss/en/dataset/luftfahrthindernisdaten-schweiz), [openAIP obstacle import](https://manager.airnavigation.aero/docs/obstacles.html), [XCTrack cable request](https://gitlab.com/xcontest-public/xctrack-public/issues/172), [OpenAir format](https://github.com/naviter/seeyou_file_formats/blob/main/OpenAir_File_Format_Support.md), [FLARM obstacles](https://flarm.com/en/general-aviation/obstacle-warning-system).
