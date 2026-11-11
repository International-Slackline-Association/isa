// Policies adopted from the ones AWS Settings created when advanced features
// were activated (ManagedAccountSecurityControlPolicy, OptOutOfAllAIServices).
// Content is unchanged; they are recreated here so the repo is the source of
// truth.

export const accountProtectionScp = {
  Version: '2012-10-17',
  Statement: [
    {
      Sid: 'BlockOrgEscape',
      Effect: 'Deny',
      Action: ['account:CloseAccount', 'organizations:AcceptHandshake', 'organizations:LeaveOrganization', 'sso:CreateInstance'],
      Resource: '*',
    },
    {
      Sid: 'ProtectManagedRoles',
      Effect: 'Deny',
      Action: [
        'iam:AttachRolePolicy', 'iam:CreateRole', 'iam:DeleteRole', 'iam:DeleteRolePermissionsBoundary',
        'iam:DeleteRolePolicy', 'iam:DetachRolePolicy', 'iam:PutRolePermissionsBoundary', 'iam:PutRolePolicy',
        'iam:TagRole', 'iam:UntagRole', 'iam:UpdateAssumeRolePolicy', 'iam:UpdateRole',
      ],
      Resource: 'arn:*:iam::*:role/managed/*',
      Condition: {
        StringNotLike: { 'aws:PrincipalArn': 'arn:*:iam::*:role/managed/AWSManagedAccountManagementAccessRole' },
      },
    },
  ],
};

export const aiServicesOptOut = {
  services: {
    '@@operators_allowed_for_child_policies': ['@@none'],
    default: {
      '@@operators_allowed_for_child_policies': ['@@none'],
      opt_out_policy: { '@@operators_allowed_for_child_policies': ['@@none'], '@@assign': 'optOut' },
    },
  },
};
