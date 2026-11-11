@documentation-system/docs/agent-essential-knowledge.md

# ISA monorepo

Monorepo of the International Slackline Association (ISA). Public. Each
project is a self-contained folder with its own docs, dependencies and
deploys. Start at [docs/README.md](docs/README.md).

## Must never

- Secrets, tokens, personal emails or private data in code, docs or commits.
- Changes outside the project folder the task is about, unless the user
  approved the cross-project change.
- AWS writes without the user approving the specific change.
- Commits the user did not ask for; pushes ever. The user pushes.

## Conventions

- Concise everywhere: docs, comments, commits, answers. Tables and bullets
  over prose.
- Simplest solution that works. Suggest, don't over-engineer; the user
  decides.
- Plan critical, impactful actions before executing. The user leads.
- pnpm, one lockfile per project.
