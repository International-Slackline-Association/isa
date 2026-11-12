---
type: notes
title: "SlackMap: open"
description: "Open work in slackmap: security fixes, reading users through isa-users, image processing, web cleanup, the missing-country stream failure, a Prerender alternative, small features."
---

# SlackMap: open

- Two security fixes in the API, after the migration (details kept out of this public repo).
- Users are read straight from isa-users' table; read them through an isa-users API instead.
- Image processing moves into slackmap, out of isa-tools.
- Web app cleanup like isa-tools: MUI and Redux not decided.
- Add 'open in new tab' button to the images.
- Martinique (MQ) is missing from `countryInfoDict.json`: since May 2026 every line or spot change fails in the stream handler, so owners are not recorded and the cluster geojson is not refreshed.
- Brainstorm an alternative to Prerender (removed) for search engines and link previews.
