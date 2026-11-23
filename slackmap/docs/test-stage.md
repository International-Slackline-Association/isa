---
type: explanation
title: "The test stage"
description: "What test.slackmap.com is for and why it differs from prod: user testing of UI and backend changes, a subset of prod data and scraping, backups, email, the session cookie and browser check, CDN logs, error digest, passes."
---

# The test stage

`test.slackmap.com` is where people try new features online before they reach prod: UI and backend changes, on a one-off copy of about 10% of prod's data, spread over every kind of line, spot, guide and group and over many countries. Only a subset: without the browser check and the session cookie, test's data can be scraped. It is not for testing the platform itself, so it does not need to match prod fully:

- No backups, deletion protection or retention.
- No email: no email flow is needed on test.
- The session cookie is not required, so the web app skips the browser check too: on test it adds only friction. Both can only be tested on prod.
- No CDN access logs and no error digest.
- Its own pass signing key, so a test pass never works on prod, and 50 anonymous activations a month instead of 5: nobody minds on test.

Its hosts nest under `test.slackmap.com`, so test's own cookies never reach prod.
