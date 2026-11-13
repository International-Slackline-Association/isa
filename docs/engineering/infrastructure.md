---
type: policy
title: Infrastructure rules
description: "How every project's AWS infrastructure is built and deployed with CDK: the infra package, config, naming and tags, stack split, importing what cannot be recreated, references between stacks and apps, Lambda bundling, secrets, the standard package scripts and running deploys."
related: [/docs/the-monorepo.md]
---

# Infrastructure rules

Why: [upgrades as we go](/docs/the-monorepo.md#upgrades-as-we-go).

## Shape

- Infrastructure is CDK in TypeScript. No Serverless Framework, no hand-written CloudFormation.
- An app's CDK app is the `infra/` package of the project's pnpm workspace, next to `server/` and `web/`.
- Account, region, domains, certificate ARNs and the names of other apps' resources live in `infra/lib/config.ts`. No context lookups.
- Names: the namespace is `{project}-{stage}`. Stacks are `{namespace}-{stack}`; a resource that keeps data or that something else looks up by name gets a fixed `{namespace}-{resource}` name, everything else a generated one. Every stack tags its resources `Namespace`, `Stage`, `StackName`, `ManagedBy`.
- Stacks split by lifecycle: `{namespace}-data` holds what keeps data, with `RemovalPolicy.RETAIN`, deletion protection where the service has it, and termination protection; `{namespace}-app` holds everything that can be destroyed and recreated.
- Data moves into new resources by copy. What cannot be recreated is imported as it is, into its own stack with termination protection and a stack policy denying replace and delete.
- Stacks and apps reference each other by names from config. No CloudFormation exports, no `${cf:…}`.
- isa-tools predates the names and keeps its own. Never rename stacks or construct IDs. A "replace" on a stateful resource in a diff is a stop.

## Code

- Lambdas are `NodejsFunction` on the current Node.js runtime; CDK bundles them with esbuild.
- No native binaries in git. A native module is installed for the Lambda's platform at bundling time.
- Secrets live in SSM Parameter Store, created by hand. CDK references them and never creates them.
- Web apps are an S3 bucket behind CloudFront with origin access control, deployed by `BucketDeployment`.
- Exact-pinned dependencies, pnpm through corepack, one lockfile per project.

## Scripts

Every project's root `package.json` carries the same building blocks: `dev`, `build`, `checkTs`, `synth`, `diff`, `deploy`. Anything run more than once becomes one of them, not a command in a doc.

## Deploying

- Deploys run from a laptop or a session with the project's profile; no CI.
- Always `diff` before `deploy`.
- A deploy runs in the background and is checked now and then; never wait on it synchronously.
