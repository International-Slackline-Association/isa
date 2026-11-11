// Inline policies for the developer permission sets. Copied 1:1 from the old
// org; the shared parts are factored out so both sets stay in sync.

const allowEverything = { Sid: 'AllowEverything', Effect: 'Allow', Action: '*', Resource: '*' };

const denyPlatformAccess = [
  { Sid: 'DenyEC2Access', Effect: 'Deny', Action: 'ec2:*', Resource: '*' },
  { Sid: 'DenyOrganizationsAccess', Effect: 'Deny', Action: 'organizations:*', Resource: '*' },
  {
    Sid: 'DenyBillingAccess',
    Effect: 'Deny',
    Action: ['aws-portal:*', 'pricing:*', 'cur:*', 'budgets:*', 'ce:*', 'tax:*', 'billing:*', 'consolidatedbilling:*'],
    Resource: '*',
  },
  {
    Sid: 'DenyAccountModifications',
    Effect: 'Deny',
    Action: ['account:*', 'aws-marketplace:*', 'activate:*', 'supportplans:*', 'support:*', 'trustedadvisor:*'],
    Resource: '*',
  },
];

const denyLogTampering = {
  Sid: 'DenyLogTampering',
  Effect: 'Deny',
  Action: [
    'cloudtrail:StopLogging', 'cloudtrail:DeleteTrail', 'cloudtrail:UpdateTrail', 'cloudtrail:PutEventSelectors',
    'config:DeleteConfigurationRecorder', 'config:StopConfigurationRecorder', 'config:DeleteDeliveryChannel',
    'guardduty:DeleteDetector', 'guardduty:DisassociateFromMasterAccount', 'guardduty:UpdateDetector',
  ],
  Resource: '*',
};

const selfEscalationActions = [
  'iam:CreateUser', 'iam:CreateAccessKey', 'iam:CreateLoginProfile', 'iam:UpdateLoginProfile',
  'iam:AttachUserPolicy', 'iam:AttachRolePolicy', 'iam:AttachGroupPolicy',
  'iam:PutUserPolicy', 'iam:PutRolePolicy', 'iam:PutGroupPolicy',
  'iam:CreatePolicy', 'iam:UpdateAssumeRolePolicy', 'iam:CreateRole', 'iam:UpdateRole',
  'iam:PutUserPermissionsBoundary', 'iam:PutRolePermissionsBoundary',
  'iam:DeleteUserPermissionsBoundary', 'iam:DeleteRolePermissionsBoundary',
  'iam:CreateSAMLProvider', 'iam:UpdateSAMLProvider', 'iam:CreateOpenIDConnectProvider',
  'sso:*', 'sso-admin:*', 'sso-directory:*', 'identitystore:*',
];

const policyVersionActions = ['iam:CreatePolicyVersion', 'iam:SetDefaultPolicyVersion'];

export const slackdataDevAccess = {
  Version: '2012-10-17',
  Statement: [
    allowEverything,
    ...denyPlatformAccess,
    {
      Sid: 'DenyIdentitySelfEscalation',
      Effect: 'Deny',
      Action: [...selfEscalationActions, ...policyVersionActions],
      Resource: '*',
    },
    denyLogTampering,
  ],
};

// Same as slackdata, except developers may edit versions of the one
// rankings-dynamodb-policy.
export function rankingsDevAccess(isaAccountId: string) {
  const rankingsDdbPolicyArn = `arn:aws:iam::${isaAccountId}:policy/rankings-dynamodb-policy`;
  return {
    Version: '2012-10-17',
    Statement: [
      allowEverything,
      ...denyPlatformAccess,
      { Sid: 'DenyIdentitySelfEscalation', Effect: 'Deny', Action: selfEscalationActions, Resource: '*' },
      {
        Sid: 'DenyPolicyEditExceptRankingsDdb',
        Effect: 'Deny',
        Action: [...policyVersionActions, 'iam:DeletePolicyVersion'],
        NotResource: rankingsDdbPolicyArn,
      },
      {
        Sid: 'AllowEditRankingsDdbPolicy',
        Effect: 'Allow',
        Action: [
          ...policyVersionActions, 'iam:DeletePolicyVersion',
          'iam:GetPolicy', 'iam:GetPolicyVersion', 'iam:ListPolicyVersions',
        ],
        Resource: rankingsDdbPolicyArn,
      },
      denyLogTampering,
    ],
  };
}
