---
type: explanation
title: "Data access"
description: "Why slackmap's map data and API sit behind a Cloudflare Turnstile browser check, a signed session cookie and per-session limits; what was rejected (AWS WAF, self-hosted proof-of-work, trap entries, encoding, rough coordinates); the terms and contributor agreement, licence and ownership of contributions; the no-safety-critical-use clause; SlackMap as a general data source and third parties as byproduct consumers; partner access to the same files through app clients."
---

# Data access

The map data is valuable: free for actual humans, not for scripters. Scripts were taking it into their own UIs and internal systems we never approved. What they already downloaded stays with them; this is about from now on. The goal is to make scraping very annoying, not impossible: a real browser or a paid solving service still gets the map file. If people still do it after this, further precautions come then.

- **The API too.** Scripts swept every line's details through it, not only the map file.
- **The single file stays.** The map loads all its data in one file so the UI works great. Protection sits on who may fetch it, not on what it holds. Rejected: rough coordinates in the file with exact lines loaded on zoom; it complicates the app.
- **Turnstile, not AWS WAF.** slackmap's bill is minimal and WAF would multiply it; its affordable form is a check page, too annoying when most people visit once or twice a month.
- **Turnstile, not a self-hosted check.** The repo is open source, so a check of our own is easy to replicate in a script.
- **Cloudflare stays minimal.** It is a secondary system that complicates things; the widget is created by hand, like the DNS records, because it hardly ever changes. No Cloudflare rules or code beyond it.
- **Rejected:** trap entries, because we cannot track them; encoding the file with a rotating key, because with the code public it adds little over the check.
- **A free app, not a strict one.** No special handling for a Cloudflare outage; don't overengineer.
- **Terms and contributor agreement are standard texts**, without a lawyer; we cannot afford one, Claude is our best-effort advisor. SlackMap is free and not critical, promises nothing and earns nothing: the texts are there to protect ISA if something goes wrong, so keep them simple. The agreement covers past contributions too, because most of the data is already in.
- **A licence, not ownership.** ISA owning contributions was rejected: it still needs the agreement check, facts like coordinates cannot be owned anyway, and contributors would lose their own content. Permission from landowners or locals to publish a spot stays out of the agreement. No export of a contributor's own contributions is built.
- **No safety-critical use.** Aviation users already show highlines in their navigation displays as obstacles, without our permission. Until a partner signs a licence, this clause in the terms is the stopgap that covers ISA. It stays generic: what the data is used for is not our concern. Only safety-critical use is named, with navigation and aviation as examples, because a warning counts where it addresses the risk; no list of individual cases.
- **A general data source.** SlackMap stays a general data source: none has an agreement with ISA today, but third parties may agree to collect the line data later; until then they are byproduct consumers.
- **Partner access.** Partners are to pay for the data. Nobody is approved today, but [partner access](partner-data.md) is built: potential partners can only be told how once a way exists. An approved partner gets an app client with a scope, the way apps reach isa-users: [how apps reach ISA services](/docs/engineering/app-access.md). With it they get the same session cookie a browser gets after the check, and fetch the same files; a filtered file of what is active is a convenience on top.
