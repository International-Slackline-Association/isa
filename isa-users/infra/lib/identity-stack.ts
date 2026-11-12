import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs';
import * as path from 'path';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  certificates,
  cognitoTriggerFunctionName,
  domains,
  isaTools,
  namespace,
  sesIdentityArn,
} from './config';

// Only what was set when the pool was created: Cognito adds the other standard attributes itself,
// and CloudFormation names custom attributes without their `custom:` prefix.
const required = (name: string): cognito.CfnUserPool.SchemaAttributeProperty => ({
  name,
  attributeDataType: 'String',
  developerOnlyAttribute: false,
  mutable: true,
  required: true,
  stringAttributeConstraints: { minLength: '0', maxLength: '2048' },
});
const schema: cognito.CfnUserPool.SchemaAttributeProperty[] = [
  required('email'),
  required('name'),
  required('family_name'),
  {
    name: 'identityType',
    attributeDataType: 'String',
    developerOnlyAttribute: false,
    mutable: true,
    required: false,
    stringAttributeConstraints: { minLength: '1', maxLength: '256' },
  },
  {
    name: 'ISA_ID',
    attributeDataType: 'String',
    developerOnlyAttribute: false,
    mutable: true,
    required: false,
    stringAttributeConstraints: {},
  },
];

const clients: Omit<cognito.CfnUserPoolClientProps, 'userPoolId'>[] = [
  {
    generateSecret: false,
    callbackUrLs: ['http://localhost:5173', 'https://account.slacklineinternational.org'],
    enablePropagateAdditionalUserContextData: false,
    idTokenValidity: 60,
    authSessionValidity: 3,
    allowedOAuthScopes: ['aws.cognito.signin.user.admin', 'email', 'openid'],
    tokenValidityUnits: {
      idToken: 'minutes',
      accessToken: 'minutes',
      refreshToken: 'days',
    },
    readAttributes: [
      'address',
      'birthdate',
      'custom:ISA_ID',
      'custom:identityType',
      'email',
      'email_verified',
      'family_name',
      'gender',
      'given_name',
      'locale',
      'middle_name',
      'name',
      'nickname',
      'phone_number',
      'phone_number_verified',
      'picture',
      'preferred_username',
      'profile',
      'updated_at',
      'website',
      'zoneinfo',
    ],
    allowedOAuthFlowsUserPoolClient: true,
    supportedIdentityProviders: ['COGNITO'],
    clientName: 'account',
    allowedOAuthFlows: ['code'],
    explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
    logoutUrLs: ['http://localhost:5173', 'https://account.slacklineinternational.org'],
    accessTokenValidity: 60,
    refreshTokenValidity: 90,
    writeAttributes: ['email', 'family_name', 'name'],
    preventUserExistenceErrors: 'ENABLED',
    enableTokenRevocation: true,
  },
  {
    generateSecret: false,
    callbackUrLs: [
      'http://localhost:8080/auth/callback',
      'https://freestyledb.com/auth/callback',
    ],
    enablePropagateAdditionalUserContextData: false,
    idTokenValidity: 60,
    authSessionValidity: 3,
    allowedOAuthScopes: ['email', 'openid', 'phone'],
    tokenValidityUnits: {
      idToken: 'minutes',
      accessToken: 'minutes',
      refreshToken: 'days',
    },
    readAttributes: [],
    allowedOAuthFlowsUserPoolClient: true,
    supportedIdentityProviders: ['COGNITO'],
    clientName: 'highline-freestyle',
    allowedOAuthFlows: ['code'],
    explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
    logoutUrLs: [],
    accessTokenValidity: 60,
    refreshTokenValidity: 5,
    writeAttributes: [],
    preventUserExistenceErrors: 'ENABLED',
    enableTokenRevocation: true,
  },
  {
    generateSecret: true,
    callbackUrLs: ['https://slackrescue.online/auth/callback'],
    enablePropagateAdditionalUserContextData: false,
    authSessionValidity: 3,
    allowedOAuthScopes: ['email', 'openid'],
    tokenValidityUnits: {
      refreshToken: 'minutes',
    },
    readAttributes: ['email', 'email_verified'],
    allowedOAuthFlowsUserPoolClient: true,
    supportedIdentityProviders: ['COGNITO'],
    clientName: 'slack-rescue-competition',
    allowedOAuthFlows: ['code'],
    explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
    logoutUrLs: ['https://slackrescue.online'],
    refreshTokenValidity: 60,
    writeAttributes: ['email', 'family_name', 'name'],
    preventUserExistenceErrors: 'ENABLED',
    enableTokenRevocation: true,
  },
  {
    generateSecret: false,
    callbackUrLs: ['http://localhost:5173', 'https://slackdata.org', 'https://www.slackdata.org'],
    enablePropagateAdditionalUserContextData: false,
    idTokenValidity: 60,
    authSessionValidity: 3,
    allowedOAuthScopes: ['email', 'openid'],
    tokenValidityUnits: {
      idToken: 'minutes',
      accessToken: 'minutes',
      refreshToken: 'days',
    },
    readAttributes: ['email', 'email_verified', 'family_name', 'name'],
    allowedOAuthFlowsUserPoolClient: true,
    supportedIdentityProviders: ['COGNITO'],
    clientName: 'slackdata',
    allowedOAuthFlows: ['code'],
    explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
    logoutUrLs: ['http://localhost:5173', 'https://slackdata.org', 'https://www.slackdata.org'],
    accessTokenValidity: 60,
    refreshTokenValidity: 90,
    writeAttributes: [],
    preventUserExistenceErrors: 'ENABLED',
    enableTokenRevocation: true,
  },
  {
    generateSecret: false,
    callbackUrLs: ['http://localhost:5173', 'https://d2ea6ot00po74u.cloudfront.net'],
    enablePropagateAdditionalUserContextData: false,
    idTokenValidity: 60,
    authSessionValidity: 3,
    allowedOAuthScopes: ['email', 'openid'],
    tokenValidityUnits: {
      idToken: 'minutes',
      accessToken: 'minutes',
      refreshToken: 'days',
    },
    readAttributes: ['email', 'email_verified'],
    allowedOAuthFlowsUserPoolClient: true,
    supportedIdentityProviders: ['COGNITO'],
    clientName: 'slackline-timer-v1',
    allowedOAuthFlows: ['code'],
    explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
    logoutUrLs: ['http://localhost:5173', 'https://d2ea6ot00po74u.cloudfront.net'],
    accessTokenValidity: 60,
    refreshTokenValidity: 90,
    writeAttributes: ['email', 'family_name', 'name'],
    preventUserExistenceErrors: 'ENABLED',
    enableTokenRevocation: true,
  },
  {
    generateSecret: false,
    callbackUrLs: ['http://localhost:5173', 'https://slackmap.com', 'https://www.slackmap.com'],
    enablePropagateAdditionalUserContextData: false,
    idTokenValidity: 60,
    authSessionValidity: 3,
    allowedOAuthScopes: ['aws.cognito.signin.user.admin', 'email', 'openid'],
    tokenValidityUnits: {
      idToken: 'minutes',
      accessToken: 'minutes',
      refreshToken: 'days',
    },
    readAttributes: [
      'address',
      'birthdate',
      'custom:identityType',
      'email',
      'email_verified',
      'family_name',
      'gender',
      'given_name',
      'locale',
      'middle_name',
      'name',
      'nickname',
      'phone_number',
      'phone_number_verified',
      'picture',
      'preferred_username',
      'profile',
      'updated_at',
      'website',
      'zoneinfo',
    ],
    allowedOAuthFlowsUserPoolClient: true,
    supportedIdentityProviders: ['COGNITO'],
    clientName: 'slackmap',
    allowedOAuthFlows: ['code'],
    explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
    logoutUrLs: ['http://localhost:5173', 'https://slackmap.com', 'https://www.slackmap.com'],
    accessTokenValidity: 60,
    refreshTokenValidity: 90,
    writeAttributes: ['email', 'family_name', 'name'],
    preventUserExistenceErrors: 'ENABLED',
    enableTokenRevocation: true,
  },
  {
    generateSecret: true,
    callbackUrLs: [
      'http://localhost:3000/api/auth/callback/cognito',
      'https://df-dev.d2c5lq1ojcfw0k.amplifyapp.com/api/auth/callback/cognito',
      'https://main.d2c5lq1ojcfw0k.amplifyapp.com/api/auth/callback/cognito',
      'https://mo-dev.d2c5lq1ojcfw0k.amplifyapp.com/api/auth/callback/cognito',
      'https://slacklinesport.org/api/auth/callback/cognito',
    ],
    enablePropagateAdditionalUserContextData: false,
    idTokenValidity: 60,
    authSessionValidity: 3,
    allowedOAuthScopes: ['email', 'openid', 'phone'],
    tokenValidityUnits: {
      idToken: 'minutes',
      accessToken: 'minutes',
      refreshToken: 'days',
    },
    readAttributes: [],
    allowedOAuthFlowsUserPoolClient: true,
    supportedIdentityProviders: ['COGNITO'],
    clientName: 'sporthub',
    allowedOAuthFlows: ['code'],
    explicitAuthFlows: ['ALLOW_REFRESH_TOKEN_AUTH'],
    logoutUrLs: [],
    accessTokenValidity: 60,
    refreshTokenValidity: 5,
    writeAttributes: [],
    preventUserExistenceErrors: 'ENABLED',
    enableTokenRevocation: true,
  },
];

export class IdentityStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const triggerArn = `arn:aws:lambda:${this.region}:${this.account}:function:${cognitoTriggerFunctionName}`;

    const pool = new cognito.CfnUserPool(this, 'UserPool', {
      policies: {
        passwordPolicy: {
          temporaryPasswordValidityDays: 90,
          requireUppercase: false,
          requireNumbers: false,
          requireLowercase: false,
          minimumLength: 8,
          requireSymbols: false,
        },
        signInPolicy: {
          allowedFirstAuthFactors: ['PASSWORD'],
        },
      },
      verificationMessageTemplate: {
        emailSubject: 'ISA Account Verification',
        emailMessageByLink: 'Please click the link below to verify your email address. {##Verify Email##}',
        emailMessage: 'The verification code: {####}',
        smsMessage: 'The verification code: {####}',
        defaultEmailOption: 'CONFIRM_WITH_LINK',
        emailSubjectByLink: 'ISA Account Verification',
      },
      issuerConfiguration: {
        type: 'ORIGINAL',
      },
      keyConfiguration: {
        keyType: 'AWS_OWNED_KEY',
      },
      mfaConfiguration: 'OFF',
      schema,
      adminCreateUserConfig: {
        inviteMessageTemplate: {
          smsMessage: 'Your username is {username} and temporary password is {####}. ',
          emailSubject: 'Registration to ISA Account',
          emailMessage: fs.readFileSync(path.join(__dirname, '../cognito/invitation-email.html'), 'utf8'),
        },
        allowAdminCreateUserOnly: false,
      },
      userPoolTier: 'LITE',
      deletionProtection: 'ACTIVE',
      smsAuthenticationMessage: 'Your authentication code is {####}. ',
      usernameConfiguration: {
        caseSensitive: false,
      },
      userPoolName: 'isa-users',
      smsVerificationMessage: 'The verification code: {####}',
      userAttributeUpdateSettings: {
        attributesRequireVerificationBeforeUpdate: ['email'],
      },
      emailConfiguration: {
        replyToEmailAddress: 'account@slacklineinternational.org',
        emailSendingAccount: 'DEVELOPER',
        from: 'ISA Account <account@slacklineinternational.org>',
        sourceArn: sesIdentityArn,
      },
      aliasAttributes: [],
      emailVerificationSubject: 'ISA Account Verification',
      lambdaConfig: {
        preSignUp: triggerArn,
        postConfirmation: triggerArn,
      },
      usernameAttributes: ['email'],
      autoVerifiedAttributes: ['email'],
      deviceConfiguration: {
        deviceOnlyRememberedOnUserPrompt: true,
        challengeRequiredOnNewDevice: false,
      },
      emailVerificationMessage: 'The verification code: {####}',
      accountRecoverySetting: {
        recoveryMechanisms: [
          {
            priority: 1,
            name: 'verified_email',
          },
        ],
      },
    });
    pool.applyRemovalPolicy(RemovalPolicy.RETAIN);

    const accountClient = clients.map((client) => {
      const resource = new cognito.CfnUserPoolClient(this, `Client-${client.clientName}`, {
        ...client,
        userPoolId: pool.ref,
      });
      resource.applyRemovalPolicy(RemovalPolicy.RETAIN);
      return resource;
    })[clients.findIndex((client) => client.clientName === 'account')];

    new cognito.CfnUserPoolDomain(this, 'PrefixDomain', {
      domain: 'isa-users',
      userPoolId: pool.ref,
    }).applyRemovalPolicy(RemovalPolicy.RETAIN);
    new cognito.CfnUserPoolDomain(this, 'CustomDomain', {
      domain: domains.auth,
      customDomainConfig: { certificateArn: certificates.cloudfront, securityPolicy: 'TLS_V1' },
      userPoolId: pool.ref,
    }).applyRemovalPolicy(RemovalPolicy.RETAIN);

    // Signed-in account users upload profile pictures straight to isa-tools' temporary-uploads
    // bucket; the API then has them resized into the images bucket.
    const uploadsIdentityPool = new cognito.CfnIdentityPool(this, 'UploadsIdentityPool', {
      identityPoolName: `${namespace.replace(/-/g, '_')}_uploads`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        { clientId: accountClient.ref, providerName: pool.attrProviderName },
      ],
    });
    const uploadsBucketArn = `arn:aws:s3:::${isaTools.temporaryUploadsBucketName}`;
    const uploadsRole = new iam.Role(this, 'UploadsRole', {
      assumedBy: new iam.FederatedPrincipal(
        'cognito-identity.amazonaws.com',
        {
          StringEquals: { 'cognito-identity.amazonaws.com:aud': uploadsIdentityPool.ref },
          'ForAnyValue:StringLike': { 'cognito-identity.amazonaws.com:amr': 'authenticated' },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      inlinePolicies: {
        Uploads: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`${uploadsBucketArn}/public/*`],
            }),
          ],
        }),
      },
    });
    new cognito.CfnIdentityPoolRoleAttachment(this, 'UploadsRoleAttachment', {
      identityPoolId: uploadsIdentityPool.ref,
      roles: { authenticated: uploadsRole.roleArn },
    });
  }
}
