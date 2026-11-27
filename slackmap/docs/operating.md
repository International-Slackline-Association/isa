---
type: how-to
title: Operating slackmap
description: "Running the slackmap web app locally (STAGE, the Mapbox token and dev key from SSM, a map that does not load, sign-in on localhost:5173) and deploying its CDK stacks per stage (prod, test: slackmap-{stage}-data, slackmap-{stage}-app): a change to the table or the buckets, the stream ARN, and the order for setting up a new stage."
---

# Operating slackmap

## Goal

The web app runs locally against a stage, a change to the data stack is deployed safely, or a new stage is set up.

## Steps

1. Locally: `dev` from the project root with `STAGE` set; the web app talks to that stage's live API and data. Its `start` reads the Mapbox token and the dev key from SSM with the `isa-admin` AWS profile and starts even when that read fails: a map that never loads means expired credentials. Refresh them and restart the server. Sign-in returns only to `localhost:5173`, so on another port nothing signed-in can be tried.
2. A change to the table or the buckets is in `slackmap-{stage}-data`; check its diff for a replace before deploying. Recreating the table's stream changes its ARN in the infra config.
3. A new stage: its certificate first ([manual operations](manual-operations.md)); deploy its data stack alone (the app stack is left out until the stream ARN is set); copy only a subset of prod's table and buckets ([why](test-stage.md)) into it before its app stack exists, so the stream handler does not replay the copy; set the stream ARN; deploy the app stack; set its uploads identity pool in the web stages and deploy again; then the DNS records. Its domain also goes into slackmap's sign-in URLs in [isa-users](/isa-users/infra/lib/identity-stack.ts) and the Mapbox token's allowed URLs.
