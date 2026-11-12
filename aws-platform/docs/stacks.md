---
type: reference
title: Stacks
description: "The CDK stacks of the AWS organization, with account, region and CLI profile for each, and where config and policies live."
---

# Stacks

| Stack | Account / region | Profile | Contains |
|---|---|---|---|
| `IsaGuardrails` | management 307498582548, eu-central-1 | `isa-org-admin` | SCPs and AI opt-out on the org root |
| `IsaIdentityCenter` | management, eu-central-1 | `isa-org-admin` | Groups, permission sets, assignments |
| `IsaBilling` | management, us-east-1 | `isa-org-admin` | Org-wide monthly budget |
| `IsaShared` | ISA 387132903656, eu-central-1 | `isa-admin` | SES domain and its notifications topic, wildcard certificate |
| `IsaSharedUsEast1` | ISA, us-east-1 | `isa-admin` | Wildcard certificate |

Config: [config/organization.ts](/aws-platform/config/organization.ts). Policies: [lib/policies/](/aws-platform/lib/policies/).
