---
type: explanation
title: "Link previews"
description: "Why slackmap.com's shareable pages (line, spot, guide, country, communities) come from the API Lambda with the item's own Open Graph tags, the cold-start trade-off, and what replaced Prerender."
---

# Link previews

When a line, spot or group is shared on WhatsApp, Slack or Facebook, the platform's bot reads the page's tags without running JavaScript, so the single-page app alone shows only the generic SlackMap card. Prerender used to fix that; it was removed because we don't want one more dependency. The goal is only that shared links display better on the platforms.

- **Everyone gets the same page.** The API Lambda writes the item's tags into `index.html` for people and bots alike, with no bot detection: the simple approach.
- **Accepted: a shared link can open about half a second slower** when no Lambda is warm and CloudFront has not cached the page yet. If it turns out too bad, the alternative is sending only the preview bots, by user agent, to the Lambda.
