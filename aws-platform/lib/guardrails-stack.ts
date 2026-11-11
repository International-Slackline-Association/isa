import { Stack, StackProps } from 'aws-cdk-lib';
import * as organizations from 'aws-cdk-lib/aws-organizations';
import { Construct } from 'constructs';
import { allowedRegions, organization } from '../config/organization';
import { accountProtectionScp, aiServicesOptOut } from './policies/managed-account';
import { regionAllowlistScp } from './policies/scp-region-allowlist';

// Organization-wide guardrails, attached to the root so every member account
// gets them. Deployed to the management account.
export class GuardrailsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { rootId } = organization;

    new organizations.CfnPolicy(this, 'RegionAllowlistScp', {
      name: 'region-allowlist',
      description: `Denies regional actions outside ${allowedRegions.join(', ')}.`,
      type: 'SERVICE_CONTROL_POLICY',
      content: regionAllowlistScp(allowedRegions),
      targetIds: [rootId],
    });

    new organizations.CfnPolicy(this, 'AccountProtectionScp', {
      name: 'account-protection',
      description: 'Member accounts cannot leave the org, close themselves or create their own Identity Center.',
      type: 'SERVICE_CONTROL_POLICY',
      content: accountProtectionScp,
      targetIds: [rootId],
    });

    new organizations.CfnPolicy(this, 'AiServicesOptOut', {
      name: 'ai-services-opt-out',
      description: 'Opt out of AWS AI services using content for service improvement.',
      type: 'AISERVICES_OPT_OUT_POLICY',
      content: aiServicesOptOut,
      targetIds: [rootId],
    });
  }
}
