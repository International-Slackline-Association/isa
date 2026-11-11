# CLAUDE.md

Pointer only. Knowledge lives in `docs/`; this file carries what every session must hold and where to read next. Repo entry: [the repo's docs](docs/README.md). Why this monorepo, its scope and the critical data: [why one monorepo](docs/the-monorepo.md).

## Our Documentation System

@docs/documentation-system/agent-essential-knowledge.md

## Must never

- Secrets, tokens or private data in code, docs or commits: the repo is public.
- Commit unasked, or push. The user pushes.

## Conventions

Repo-wide; read the policy when you touch that kind of code. A scope's own conventions arrive with its `docs/README.md`.

- **Engineering**: humans keep architecture and decisions, agents code and never add a new shape on their own; [how we build](docs/engineering/how-we-build.md), the rules in [coding rules](docs/engineering/coding/coding-rules.md). A change is held against the [architecture rules](docs/engineering/architecture-rules.md). Plan critical, impactful actions first; the user decides. When the work is finished, `/review-code` reads them back.
- **Code comments** say only what the code around them cannot show. [Code comments](docs/engineering/coding/code-comments.md)
- **Testing**: a new unit test exists only where a rule in the policy allows it. [Unit tests](docs/engineering/coding/testing/unit-tests.md)
- **Communication**: concise everywhere, docs, comments, commits, answers; tables and bullets over prose.
