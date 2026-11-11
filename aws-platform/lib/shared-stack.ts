import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as ses from 'aws-cdk-lib/aws-ses';
import { Construct } from 'constructs';
import { shared } from '../config/organization';
import { wildcardCertificate } from './wildcard-certificate';

// ISA-wide resources in eu-central-1: the SES sending domain (used by
// Cognito, isa-users and slackmap) and the wildcard certificate of the
// account- and tools-API custom domains. Imported from existing resources:
// keep construct IDs and properties as they are.
export class SharedStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DKIM keys are deliberately not modelled: an update must never rotate
    // them, the CNAMEs at Cloudflare would break. Bounce/complaint topics
    // (isa-tools SNS) are not part of the CloudFormation model.
    const sesDomain = new ses.CfnEmailIdentity(this, 'SesDomainIdentity', {
      emailIdentity: shared.domain,
      dkimAttributes: { signingEnabled: true },
      feedbackAttributes: { emailForwardingEnabled: true },
      mailFromAttributes: { behaviorOnMxFailure: 'USE_DEFAULT_VALUE' },
    });
    sesDomain.applyRemovalPolicy(RemovalPolicy.RETAIN);

    wildcardCertificate(this);
  }
}
