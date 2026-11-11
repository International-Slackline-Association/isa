---
type: notes
title: "ISA tools: open"
description: "Open work in isa-tools: moving the website iframes to the tools domain, the image processor boundary, personal data behind the Origin check."
nav: { order: 100 }
---

# ISA tools: open

- Point the iframes of data.slacklineinternational.org at `tools.slacklineinternational.org`; they are broken until then.
- The image processor serves only isa-users and slackmap and writes into their buckets: a boundary violation. Each service should be capable and self-isolated.
- `GET /sheets/certificate?email=` returns a person's certificates behind only the Origin check, which any client can fake.
