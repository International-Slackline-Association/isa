---
name: find-in-docs
description: Map and search the monorepo docs before starting work in an area or when context is missing. Also invoked as /find-in-docs <[keywords]>. Returns doc paths + descriptions only. Read the docs it points at yourself.
---

From the repo root:

```bash
node .claude/skills/find-in-docs/find-in-docs.mjs <keywords…>          # search title, description, path
node .claude/skills/find-in-docs/find-in-docs.mjs --dir <path>         # list a subtree's docs, plus its markdown not in the catalog
node .claude/skills/find-in-docs/find-in-docs.mjs --map                # catalog overview
```

Keywords combine with OR and a doc matching several ranks first, so give two or three specific terms, not one generic word and not a sentence. Terms of three letters or fewer must match exactly.

On a fresh checkout it fails with a missing-module error once: `pnpm install --dir .claude/skills/find-in-docs`, then retry.

Reading the output:

- `path [type] description`: one doc per line. In `--dir` views paths are relative to the dir; a `sub/ — N doc(s) · …` line is a subfolder with its own README, collapsed (go one `--dir` deeper); a bare `sub/` line is a grouping folder and its docs follow, indented.
- README entries list first: a folder's README is its entry point. Read it when entering an area.
- `not in the catalog (no type/description): …` under `--dir`. Markdown in the scope that never joined the catalog: legacy docs. The scope is unconverted; read them by filename when the task fits and check what they say against the code.
- A keyword miss prints the nearest docs instead of nothing, a signal to browse, not an error.

The tool only points. Pick the relevant hits and read the files; never answer from descriptions alone.
