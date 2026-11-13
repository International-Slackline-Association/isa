---
type: how-to
title: Changing certificate templates
description: "Editing the certificate PDF templates and their signers: the template sources, the build, what to commit, the fixed positions the server writes to."
---

# Changing certificate templates

## Goal

A changed template or signer is in the blank PDFs the server draws onto.

## Steps

1. Edit the sources in [templates/source](/isa-tools/server/src/core/certificates/generators/pdfGenerators/templates/source/): [certificates.mjs](/isa-tools/server/src/core/certificates/generators/pdfGenerators/templates/source/certificates.mjs) holds one entry per template (wording, logo, signers), [signatories.mjs](/isa-tools/server/src/core/certificates/generators/pdfGenerators/templates/source/signatories.mjs) the signers, [build.mjs](/isa-tools/server/src/core/certificates/generators/pdfGenerators/templates/source/build.mjs) the shared layout.
2. A new signer: a transparent PNG or SVG in [signatures](/isa-tools/server/src/core/certificates/generators/pdfGenerators/templates/source/signatures/), the person in [signatories.mjs](/isa-tools/server/src/core/certificates/generators/pdfGenerators/templates/source/signatories.mjs), the template entries in [certificates.mjs](/isa-tools/server/src/core/certificates/generators/pdfGenerators/templates/source/certificates.mjs) pointed at them.
3. Keep every label where the server writes its value: names, dates and QR codes are drawn at fixed positions, set per certificate type in its generator, [instructor.ts](/isa-tools/server/src/core/certificates/generators/pdfGenerators/instructor.ts) for one.
4. Run the server's `build:certificate-templates`, for all templates or one by name. It needs Google Chrome, or `CHROME_PATH`. The HTML lands in `.preview/` to open in a browser while tweaking.
5. Commit the regenerated PDFs: the server reads those, never the sources.

## Verification

- The PDFs of the templates you touched changed and look right.
