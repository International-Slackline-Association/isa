// Denies regional actions outside the allowed regions. Global services are
// exempt (list based on the AWS Organizations "deny by requested region"
// example). Replaces the AdvancedModeRegionRestrictionSecurityControlPolicy
// that AWS Settings created, which only allowed eu-north-1/us-east-1/us-west-2.

const globalServiceActions = [
  'a4b:*', 'access-analyzer:*', 'account:*', 'acm:*', 'aws-marketplace-management:*', 'aws-marketplace:*',
  'aws-portal:*', 'billing:*', 'budgets:*', 'ce:*', 'chime:*', 'cloudfront:*', 'config:*', 'cur:*',
  'directconnect:*', 'ec2:DescribeRegions', 'ec2:DescribeTransitGateways', 'ec2:DescribeVpnGateways',
  'fms:*', 'globalaccelerator:*', 'health:*', 'iam:*', 'identitystore:*', 'importexport:*', 'kms:*',
  'mobileanalytics:*', 'networkmanager:*', 'organizations:*', 'pricing:*', 'route53:*', 'route53domains:*',
  'route53-recovery-cluster:*', 'route53-recovery-control-config:*', 'route53-recovery-readiness:*',
  's3:GetAccountPublic*', 's3:ListAllMyBuckets', 's3:ListMultiRegionAccessPoints', 's3:PutAccountPublic*',
  'shield:*', 'sso:*', 'sso-directory:*', 'sts:*', 'support:*', 'tax:*', 'trustedadvisor:*',
  'waf-regional:*', 'waf:*', 'wafv2:*',
];

export function regionAllowlistScp(allowedRegions: readonly string[]) {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'DenyOutsideAllowedRegions',
        Effect: 'Deny',
        NotAction: globalServiceActions,
        Resource: '*',
        Condition: {
          StringNotEquals: { 'aws:RequestedRegion': allowedRegions },
          ArnNotLike: {
            'aws:PrincipalARN': [
              // Admins can still clean up stray resources in any region.
              'arn:aws:iam::*:role/aws-reserved/sso.amazonaws.com/*/AWSReservedSSO_AdministratorAccess_*',
              // Lambda@Edge runs and logs in whichever region serves the request.
              'arn:aws:iam::*:role/*LambdaEdge*',
            ],
          },
        },
      },
    ],
  };
}
