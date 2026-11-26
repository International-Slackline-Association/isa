---
type: explanation
title: "The test stage"
description: "What test.slackmap.com is for and why it differs from prod: user testing of UI and backend changes, a subset of prod data and scraping, the session cookie and browser check, passes."
---

# The test stage

`test.slackmap.com` is where people try new features online before they reach prod: UI and backend changes, on a subset of prod's data: without the browser check and the session cookie, test's data can be scraped. It is not for testing the platform itself, so it does not need to match prod fully:

- The session cookie is not required, so the web app skips the browser check too: on test it adds only friction. Both can only be tested on prod.
- Its own pass signing key, so a test pass never works on prod.

Its hosts nest under `test.slackmap.com`, so test's own cookies never reach prod.
