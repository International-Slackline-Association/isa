---
type: explanation
title: "Link previews and search engines"
description: "Why slackmap.com's shareable pages (line, spot, guide, country, communities) come from the API Lambda with the item's own title, Open Graph tags and card text, and why there is a sitemap: link previews and search engines behind the browser check; the cold-start trade-off, and what replaced Prerender."
---

# Link previews and search engines

When a line, spot or group is shared on WhatsApp, Slack or Facebook, the platform's bot reads the page's tags without running JavaScript, so the single-page app alone shows only the generic SlackMap card. Prerender used to fix that; it was removed because we don't want one more dependency.

Search engines and similar beneficial parties should index SlackMap. The [browser check](data-access.md) blocked them, which nobody thought of when it was built: they never pass it, so the app's calls for an item's details are refused and they saw an empty card. So the page itself carries what they need: the item's title, and the text its card shows until the API answers, never its geometry. They cannot follow the map to a page, so the sitemap lists every page.

- **Everyone gets the same page.** The API Lambda writes the item's tags into `index.html` for people and bots alike, with no bot detection: the simple approach.
- **Accepted: a shared link can open about half a second slower** when no Lambda is warm and CloudFront has not cached the page yet. If it turns out too bad, the alternative is sending only the preview bots, by user agent, to the Lambda.
