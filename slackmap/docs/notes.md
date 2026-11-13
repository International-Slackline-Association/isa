---
type: notes
title: "SlackMap: open"
description: "Open work in slackmap: reading users through isa-users, image processing, web cleanup, a Prerender alternative."
---

# SlackMap: open

- Users are read straight from isa-users' table; read them through an isa-users API instead.
- Image processing moves into slackmap, out of isa-tools.
- Brainstorm an alternative to Prerender (removed) for search engines and link previews.
- Around end of November 2026: delete the API Gateway custom domain `api.slackmap.com`, its base path mapping and the eu-central-1 `slackmap.com` certificate (the API now runs behind CloudFront).
