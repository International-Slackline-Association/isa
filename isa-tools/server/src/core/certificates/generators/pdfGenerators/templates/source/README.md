# Certificate template sources

The blank PDFs in the parent folder are generated from these files. The server still uses those PDFs as
before and draws names, dates and QR codes onto them. Edit here, rebuild, and commit the regenerated PDFs.

| File               | What it holds                                                            |
| ------------------ | ------------------------------------------------------------------------ |
| `certificates.mjs` | One entry per template: title, static wording, logo variant, signers     |
| `signatories.mjs`  | Signer names, roles and signature images                                 |
| `build.mjs`        | Shared layout (frame, logo, seal, QR box, signature blocks) + PDF export |
| `art/`             | Vector artwork taken from the original designs                           |
| `signatures/`      | Transparent signature images (PNG or SVG)                                |

## Build

Needs Google Chrome installed locally (or set `CHROME_PATH`).

```sh
pnpm run build:certificate-templates                 # all templates
pnpm run build:certificate-templates instructor-en # just one
```

The generated HTML is written to `.preview/` (git-ignored) so a template can be opened in a browser while
tweaking.

## Changing a signer

1. Add the signature to `signatures/` as a transparent PNG or SVG.
2. Add or update the person in `signatories.mjs`.
3. Point the relevant entries in `certificates.mjs` at them.
4. Run the build and check the PDFs.

## Keep in mind

The server writes values at fixed positions (see the generator for each type, e.g. `../../instructor.ts`).
Labels such as "The certification was acquired on" must stay where those values expect them.
