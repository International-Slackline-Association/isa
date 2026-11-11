---
type: policy
title: Architecture rules
description: "The rules a change's shape is held against in every project of the repo: AWS first, dependencies, the monorepo, failures seen and recoverable."
related: [coding/coding-rules.md]
nav: { order: 12 }
---

# Architecture rules

The [coding rules](coding/coding-rules.md) hold for every line of code. These rules hold for the shape of a change: what it adds, where a fact lives, what it reaches and what it exposes. A change that cannot keep a rule says so in its description, and the human decides.

- **AWS first.** A need is met with an AWS service before a third-party service, and with a managed service before anything we host ourselves.
- **Few dependencies.** A new library or external service is only added when it saves more than it costs to own, and only after it is checked: who maintains it, how it is published, what it pulls in, so that it opens no door for a supply chain attack. Adding one is the human's decision and is named in the change.
- **In the monorepo.** Code, configuration, infrastructure, templates and content live in this repo. A vendor whose logic can only be changed in its own UI is not chosen.
- **Seen, and recoverable.** A failure is detected, alerted and visible to a person, and can be corrected: rolled back, replayed or fixed by hand. A failure that could cause data loss or a data exposure is prevented and tested for, not only detected.
