---
type: explanation
title: "The test stage"
description: "What test.slackmap.com is for and why it differs from prod: user testing of UI and backend changes, copied prod data, backups, email, the session cookie, CDN logs, error digest."
---

# The test stage

`test.slackmap.com` is where people try new features online before they reach prod: UI and backend changes, on a one-off copy of prod's data. It is not for testing the platform itself, so it does not need to match prod fully:

- No backups, deletion protection or retention.
- No email: no email flow is needed on test.
- The session cookie is not required, so the browser check and the cookie gate can only be tested on prod.
- No CDN access logs and no error digest.

Its hosts nest under `test.slackmap.com`, so test's own cookies never reach prod.
