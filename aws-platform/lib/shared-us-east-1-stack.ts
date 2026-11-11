import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { wildcardCertificate } from './wildcard-certificate';

// ISA-wide resources that must live in us-east-1: the wildcard certificate
// used by CloudFront and the Cognito custom domain. Imported from an existing
// resource: keep construct IDs and properties as they are.
export class SharedUsEast1Stack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    wildcardCertificate(this);
  }
}
