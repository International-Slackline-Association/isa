import { Stack, StackProps } from 'aws-cdk-lib';
import * as identitystore from 'aws-cdk-lib/aws-identitystore';
import * as sso from 'aws-cdk-lib/aws-sso';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';
import {
  accounts,
  groups,
  identityCenter,
  PermissionSetName,
  UserName,
  users,
} from '../config/organization';
import { rankingsDevAccess, slackdataDevAccess } from './policies/developer-access';

// Identity Center groups, permission sets and account assignments.
// Users themselves are created in the console (CloudFormation has no
// resource for them); their IDs are looked up here by username.
export class IdentityCenterStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const { instanceArn, identityStoreId } = identityCenter;

    const userIds = Object.fromEntries(
      users.map((userName) => [userName, this.lookupUserId(identityStoreId, userName)]),
    ) as Record<UserName, string>;

    const permissionSets: Record<PermissionSetName, sso.CfnPermissionSet> = {
      AdministratorAccess: new sso.CfnPermissionSet(this, 'AdministratorAccess', {
        instanceArn,
        name: 'AdministratorAccess',
        sessionDuration: 'PT8H',
        managedPolicies: [
          'arn:aws:iam::aws:policy/AdministratorAccess',
          'arn:aws:iam::aws:policy/AWSBillingReadOnlyAccess',
        ],
      }),
      'rankings-dev-access': new sso.CfnPermissionSet(this, 'RankingsDevAccess', {
        instanceArn,
        name: 'rankings-dev-access',
        description: 'Rankings custom dev access',
        sessionDuration: 'PT8H',
        inlinePolicy: rankingsDevAccess(accounts.isa),
      }),
      'slackdata-dev-access': new sso.CfnPermissionSet(this, 'SlackdataDevAccess', {
        instanceArn,
        name: 'slackdata-dev-access',
        description: 'Developers of slackdata',
        sessionDuration: 'PT1H',
        inlinePolicy: slackdataDevAccess,
      }),
    };

    for (const [groupName, group] of Object.entries(groups)) {
      const cfnGroup = new identitystore.CfnGroup(this, `Group-${groupName}`, {
        identityStoreId,
        displayName: groupName,
        description: group.description,
      });

      for (const member of group.members) {
        new identitystore.CfnGroupMembership(this, `Member-${groupName}-${member}`, {
          identityStoreId,
          groupId: cfnGroup.attrGroupId,
          memberId: { userId: userIds[member] },
        });
      }

      for (const { permissionSet, accounts: accountNames } of group.access) {
        for (const accountName of accountNames) {
          new sso.CfnAssignment(this, `Assign-${groupName}-${permissionSet}-${accountName}`, {
            instanceArn,
            permissionSetArn: permissionSets[permissionSet].attrPermissionSetArn,
            principalType: 'GROUP',
            principalId: cfnGroup.attrGroupId,
            targetType: 'AWS_ACCOUNT',
            targetId: accounts[accountName],
          });
        }
      }
    }
  }

  private lookupUserId(identityStoreId: string, userName: string): string {
    const call: cr.AwsSdkCall = {
      service: 'IdentityStore',
      action: 'GetUserId',
      parameters: {
        IdentityStoreId: identityStoreId,
        AlternateIdentifier: { UniqueAttribute: { AttributePath: 'userName', AttributeValue: userName } },
      },
      physicalResourceId: cr.PhysicalResourceId.of(`user-${userName}`),
    };
    const lookup = new cr.AwsCustomResource(this, `UserId-${userName}`, {
      onCreate: call,
      onUpdate: call,
      installLatestAwsSdk: false,
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({ resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE }),
    });
    return lookup.getResponseField('UserId');
  }
}
