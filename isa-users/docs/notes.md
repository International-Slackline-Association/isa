---
type: notes
title: "ISA users: open"
description: "Open work in isa-users: client ownership, direct table reads by slackmap, image processing."
---

# ISA users: open

- Our own apps (slackmap, account) get their own client, in their own stack; other teams' clients stay here.
- slackmap reads the users table directly; it should ask an isa-users API instead.
- Image processing moves into isa-users, out of isa-tools.
