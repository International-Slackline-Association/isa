---
type: explanation
title: "Link previews and search engines"
description: "Why slackmap.com's shareable pages (line, spot, guide, country, communities) come from the API Lambda with the item's own title, Open Graph tags and card text, and why there is a sitemap: link previews and search engines behind the browser check."
---

# Link previews and search engines

When a line, spot or group is shared on WhatsApp, Slack or Facebook, the platform's bot reads the page's tags without running JavaScript, so the single-page app alone shows only the generic SlackMap card.

Search engines and similar beneficial parties should index SlackMap, and they never pass the [browser check](data-access.md). So the page itself carries what they need: the item's title, and the text its card shows until the API answers, never its geometry. They cannot follow the map to a page, so the sitemap lists every page.

- **Everyone gets the same page**, people and bots alike, with no bot detection: the simple approach.
