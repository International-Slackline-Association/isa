---
type: explanation
title: "Look and feel"
description: "Why the SlackMap web app looks the way it does: style, vibe, theme, card shell, pop-up frame, colors, logo, fonts, drawings and emoji, phone layout, dark mode."
---

# Look and feel

SlackMap is for a close community. It is not truly official, but official enough for a corporate look, and it needs to be friendly with some playful vibes. Above all it must look made by a single person with one coherent mind: before this, button styles, pop-up colors and panel colors drifted apart feature by feature. Playful must not mean old-school websites made to be playful, and the spacing stays compact, not roomy.

## How it holds together

- **One theme** holds every color, corner and size, and the parts (buttons, fields, chips, menus, alerts) are styled there once. A screen uses the parts plainly instead of painting its own. Detail cards share one card shell, the create and edit pages one form frame, and every pop-up one frame (the photo viewer, a full-screen lightbox, is the exception), so the look cannot drift apart again.
- **The map is the page.** The side panel, the cards, the forms and the pop-ups float on it. The blue panel is the one colored surface; everything you read, fill in or decide on is white. That is the best of the two worlds, for those who like a dark app and those who like a white one.
- **Colors have jobs.** Blue is the main action, one per view. Magenta means live, and only live: activation got its own color because orange has long been the access guides' color on the map. Red is delete, and a line on the map; green is success, and a spot.
- **Friendly by detail, not by cartoon.** Icons and the live dot carry the friendliness. Flat drawings are for pictures that explain or stand in for something (the activation's how-it-works, the tutorial, a missing photo), and there is no emoji.

## Decided against the defaults

- The blue is deeper than SlackMap's old `#4187C5`, so white text on it stays readable. It is still SlackMap's blue.
- The logo is a clean SVG, never on a white tile. On the blue panel "Slack" and the pin's tip turn white so they stay visible; the pin and "Map" keep their colors.
- Titles are plain Barlow, not the ISA brand's Barlow Condensed: a deliberate SlackMap exception to the brand.
- On phones a card or a form is a sheet over a full-height map, not a block below a shortened one.
- No dark mode for now.
