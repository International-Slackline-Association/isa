---
type: notes
title: "ISA users: open"
description: "Open work in isa-users: client ownership, image processing, SportHub's direct table reads."
---

# ISA users: open

- Our own apps (slackmap, account) get their own client, in their own stack; other teams' clients stay here.
- Image processing moves into isa-users, out of isa-tools.
- SportHub reads the users table directly; move it to the `/v1` endpoints.
