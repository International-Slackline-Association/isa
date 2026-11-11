#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { accounts, region } from '../config/organization';
import { BillingStack } from '../lib/billing-stack';
import { GuardrailsStack } from '../lib/guardrails-stack';
import { IdentityCenterStack } from '../lib/identity-center-stack';
import { SharedStack } from '../lib/shared-stack';
import { SharedUsEast1Stack } from '../lib/shared-us-east-1-stack';

const app = new App();

// Management account (profile isa-org-admin).
const env = { account: accounts.management, region };
new GuardrailsStack(app, 'IsaGuardrails', { env });
new IdentityCenterStack(app, 'IsaIdentityCenter', { env });
new BillingStack(app, 'IsaBilling', { env: { account: accounts.management, region: 'us-east-1' } });

// ISA account (profile isa-admin).
new SharedStack(app, 'IsaShared', {
  env: { account: accounts.isa, region },
  terminationProtection: true,
});
new SharedUsEast1Stack(app, 'IsaSharedUsEast1', {
  env: { account: accounts.isa, region: 'us-east-1' },
  terminationProtection: true,
});
