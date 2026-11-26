---
type: explanation
title: "Data access"
description: "Why slackmap's map data and API sit behind a Cloudflare Turnstile browser check and a signed session cookie; the terms and contributor agreement; the no-safety-critical-use clause; SlackMap as a general data source and third parties as byproduct consumers."
---

# Data access

The map data is valuable: free for actual humans; scripters need permission.

- **Text is public, geometry is not.** Every page and the sitemap listing them are open on purpose, so search engines can index SlackMap ([why](link-previews.md)).
- **The single file stays.** The map loads all its data in one file so the UI works great. Protection sits on who may fetch it, not on what it holds.
- **Cloudflare stays minimal.** It is a secondary system that complicates things: no Cloudflare rules or code beyond the widget.
- **Nothing more without asking.** No further defence against scraping is added unless asked for.
- **Terms and contributor agreement are standard texts.** SlackMap is free and not critical, so keep them simple.
- **No safety-critical use.** This clause in the terms stays generic. Only safety-critical use is named, with navigation and aviation as examples, because a warning counts where it addresses the risk; no list of individual cases.
- **A general data source.** SlackMap stays a general data source: none has an agreement with ISA today, but third parties may agree to collect the line data later; until then they are byproduct consumers.
