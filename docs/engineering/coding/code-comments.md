---
type: policy
title: Code comments
description: What a code comment may say (only what the code around it cannot show), and where a wider why goes instead.
related: [/documentation-system/docs/content-rules.md]
nav: { order: 22 }
---

# Code comments

Why: [the content rules](/documentation-system/docs/content-rules.md), with the surrounding code as the scope.

1. A comment says only what a competent reader cannot reconstruct from the code around it: the why of this line, an external quirk, a contract this code participates in, a non-obvious constraint.
2. A comment that narrates the code (what the next lines do, what a function handles, what a type is) fails the test. Delete it.
3. A why that governs more than the lines around it belongs in the scope's explanation, and nowhere in the code. No pointer comment: the scope's `docs/README.md` is the pointer.
4. Never invent a why. If you do not know why the code is shaped this way, write no comment and ask.
5. No commented-out code, no changelog or author stamps.
