---
type: policy
title: Infrastructure rules
description: "How every project's AWS infrastructure is built and deployed with CDK: the infra package, config, stack split, references between stacks and apps, Lambda bundling, secrets, alarms, the standard package scripts and running deploys."
related: [/docs/the-monorepo.md]
nav: { order: 14 }
---

# Infrastructure rules

Why: [upgrades as we go](/docs/the-monorepo.md#upgrades-as-we-go).

## Shape

- Infrastructure is CDK in TypeScript. No Serverless Framework, no hand-written CloudFormation.
- An app's CDK app is the `infra/` package of the project's pnpm workspace, next to `server/` and `web/`.
- Account, region, domains, certificate ARNs and the names of other apps' resources live in `infra/lib/config.ts`. No context lookups.
- Stacks split by lifecycle: `<App>Data` holds what keeps data, with `RemovalPolicy.RETAIN`, deletion protection where the service has it, and termination protection; `<App>App` holds everything that can be destroyed and recreated.
- Stacks and apps reference each other by names from config. No CloudFormation exports, no `${cf:…}`.
- Never rename stacks or construct IDs. A "replace" on a stateful resource in a diff is a stop.

## Code

- Lambdas are `NodejsFunction` on the current Node.js runtime; CDK bundles them with esbuild.
- No native binaries in git. A native module is installed for the Lambda's platform at bundling time.
- Secrets live in SSM Parameter Store, created by hand. CDK references them and never creates them.
- Web apps are an S3 bucket behind CloudFront with origin access control, deployed by `BucketDeployment`.
- Lambda errors raise a CloudWatch alarm to the role address `aws@slacklineinternational.org`.
- Exact-pinned dependencies, pnpm through corepack, one lockfile per project.

## Scripts

Every project's root `package.json` carries the same building blocks: `dev`, `build`, `checkTs`, `synth`, `diff`, `deploy`. Anything run more than once becomes one of them, not a command in a doc.

## Deploying

- Deploys run from a laptop or a session with the project's profile; no CI.
- Always `diff` before `deploy`.
- A deploy runs in the background and is checked now and then; never wait on it synchronously.
