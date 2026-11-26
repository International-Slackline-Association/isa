---
type: explanation
title: "Why only the brand"
description: "What isa-brand shares across ISA apps and what it leaves to each app (Tailwind, components, React, frameworks); why each app holds its own copy; what was not taken from Onsight."
---

# Why only the brand

Extract where the balance is right. Apps have free will to use different tech and cannot be forced, so Tailwind, components and the like are too constraining to share. What is shared is the brand as data any stack can read: colors as roles, the Barlow fonts, the logos. Bindings to a framework, components and behaviour stay in each app.

- **Each app holds a copy.** An app pulls the files into its own source with [pull.mjs](/isa-brand/pull.mjs) and commits them. It is not a package dependency, of isa-brand or of Onsight.
- **tokens.css is the source**, edited by hand, and holds only colors and font families; spacing, sizes and type scales stay in each app. Onsight's JSON token build and its contrast check were not taken, nor its Tailwind theme, components, React wrappers or scripts.
- **Fonts are files here**, not loaded from Google, so visitors' browsers never contact Google; npm font packages per app were the alternative.
