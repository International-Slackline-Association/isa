import { RemovalPolicy } from 'aws-cdk-lib';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';
import { shared } from '../config/organization';

// Imported *.slacklineinternational.org certificate. DNS validation record
// lives at Cloudflare. Every property here is create-only: changing one
// replaces the certificate, which then waits for a new Cloudflare record.
export function wildcardCertificate(scope: Construct): acm.CfnCertificate {
  const name = `*.${shared.domain}`;
  const certificate = new acm.CfnCertificate(scope, 'WildcardCertificate', {
    domainName: name,
    subjectAlternativeNames: [name],
    validationMethod: 'DNS',
    domainValidationOptions: [{ domainName: name, validationDomain: name }],
    keyAlgorithm: 'RSA_2048',
    certificateTransparencyLoggingPreference: 'ENABLED',
  });
  certificate.applyRemovalPolicy(RemovalPolicy.RETAIN);
  return certificate;
}
