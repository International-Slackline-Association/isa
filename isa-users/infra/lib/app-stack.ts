import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { Annotations, Duration, RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  certificates,
  cognitoTriggerFunctionName,
  domains,
  imagesBucketName,
  isaTools,
  stage,
  sesIdentityArn,
  tableName,
  userPool,
  errorDigest,
} from './config';

const projectRoot = path.join(__dirname, '../..');
const serverRoot = path.join(projectRoot, 'server');

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = dynamodb.Table.fromTableName(this, 'UsersTable', tableName);
    const imagesBucket = s3.Bucket.fromBucketName(this, 'ImagesBucket', imagesBucketName);
    const pool = cognito.UserPool.fromUserPoolArn(this, 'UserPool', userPool.arn);
    const cloudfrontCertificate = acm.Certificate.fromCertificateArn(
      this,
      'CloudFrontCertificate',
      certificates.cloudfront,
    );

    const environment = {
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      ISA_USERS_TABLE: tableName,
      ISA_USERS_IMAGES_S3_BUCKET: imagesBucketName,
      USERPOOL_ID: userPool.id,
      AUTH_DOMAIN: domains.auth,
      ACCOUNT_DOMAIN: domains.web,
      ACCOUNT_CLIENT_ID: userPool.accountClientId,
      ISA_TOOLS_TRUSTED_SERVICE_API_KEY: ssm.StringParameter.valueForStringParameter(
        this,
        isaTools.trustedServiceApiKeyParameter,
      ),
    };
    const functionProps = (name: string, entry: string): nodejs.NodejsFunctionProps => ({
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'main',
      entry: path.join(serverRoot, entry),
      projectRoot,
      depsLockFilePath: path.join(projectRoot, 'pnpm-lock.yaml'),
      memorySize: 1024,
      timeout: Duration.seconds(29),
      environment,
      bundling: {
        sourceMap: true,
        target: 'node24',
        tsconfig: path.join(serverRoot, 'tsconfig.json'),
        externalModules: [],
      },
      logGroup: new logs.LogGroup(this, `${name}Logs`, {
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    });

    const apiFunction = new nodejs.NodejsFunction(
      this,
      'ApiFunction',
      functionProps('ApiFunction', 'src/functions/api/handler.ts'),
    );
    const cognitoTriggerFunction = new nodejs.NodejsFunction(this, 'CognitoTriggerFunction', {
      ...functionProps('CognitoTriggerFunction', 'src/functions/cognito/handler.ts'),
      functionName: cognitoTriggerFunctionName,
    });
    cognitoTriggerFunction.addPermission('InvokedByUserPool', {
      principal: new iam.ServicePrincipal('cognito-idp.amazonaws.com'),
      sourceArn: userPool.arn,
    });

    for (const fn of [apiFunction, cognitoTriggerFunction]) {
      table.grantReadWriteData(fn);
      fn.addToRolePolicy(
        new iam.PolicyStatement({ actions: ['ses:SendEmail'], resources: [sesIdentityArn] }),
      );
    }
    imagesBucket.grantReadWrite(apiFunction);
    apiFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cognito-idp:AdminUpdateUserAttributes', 'cognito-idp:AdminGetUser'],
        resources: [userPool.arn],
      }),
    );

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'isa-users',
      cloudWatchRole: false,
      endpointConfiguration: { types: [apigateway.EndpointType.REGIONAL] },
      minCompressionSize: Size.bytes(1024),
      deployOptions: { stageName: stage },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: [...apigateway.Cors.DEFAULT_HEADERS, 'X-Amz-User-Agent'],
      },
    });
    const integration = new apigateway.LambdaIntegration(apiFunction);
    api.root.addResource('{proxy+}').addMethod('ANY', integration, {
      authorizer: new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
        cognitoUserPools: [pool],
      }),
    });
    // Email verification links, and requests to resend them, come without a session.
    api.root.addResource('verify').addResource('{proxy+}').addMethod('ANY', integration);

    // The custom domain itself is managed by hand.
    new apigateway.CfnBasePathMapping(this, 'ApiDomainMapping', {
      domainName: domains.api,
      restApiId: api.restApiId,
      stage: api.deploymentStage.stageName,
    });

    const webBucket = new s3.Bucket(this, 'WebBucket', {
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });
    const spaRewrite = new cloudfront.Function(this, 'SpaRewrite', {
      runtime: cloudfront.FunctionRuntime.JS_2_0,
      code: cloudfront.FunctionCode.fromInline(
        "function handler(event) { var r = event.request; if (r.uri.indexOf('.') === -1) { r.uri = '/index.html'; } return r; }",
      ),
    });
    const webDistribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [domains.web],
      certificate: cloudfrontCertificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(webBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        functionAssociations: [
          { function: spaRewrite, eventType: cloudfront.FunctionEventType.VIEWER_REQUEST },
        ],
      },
    });

    const webDist = path.join(projectRoot, 'web/dist');
    const webAssets = new s3deploy.BucketDeployment(this, 'WebAssets', {
      sources: [s3deploy.Source.asset(webDist, { exclude: ['index.html'] })],
      destinationBucket: webBucket,
      exclude: ['index.html'],
      cacheControl: [s3deploy.CacheControl.fromString('public, max-age=31536000')],
    });
    const webIndex = new s3deploy.BucketDeployment(this, 'WebIndex', {
      sources: [s3deploy.Source.asset(webDist, { exclude: ['*', '!index.html'] })],
      destinationBucket: webBucket,
      prune: false,
      cacheControl: [s3deploy.CacheControl.fromString('no-cache, no-store, must-revalidate')],
      distribution: webDistribution,
    });
    // index.html points at the hashed assets, so it may only go live after them.
    webIndex.node.addDependency(webAssets);

    const imagesDistribution = new cloudfront.Distribution(this, 'ImagesDistribution', {
      domainNames: [domains.images],
      certificate: cloudfrontCertificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(imagesBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });
    // The bucket is imported, so CDK cannot add the read grant for the distribution itself.
    Annotations.of(imagesDistribution).acknowledgeWarning(
      '@aws-cdk/aws-cloudfront-origins:updateImportedBucketPolicyOac',
    );
    const imagesBucketPolicy = new s3.BucketPolicy(this, 'ImagesBucketPolicy', {
      bucket: imagesBucket,
    });
    imagesBucketPolicy.document.addStatements(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [imagesBucket.arnForObjects('*')],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${imagesDistribution.distributionId}`,
          },
        },
      }),
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [imagesBucket.bucketArn, imagesBucket.arnForObjects('*')],
        conditions: { Bool: { 'aws:SecureTransport': 'false' } },
      }),
    );

    new iam.Role(this, 'ErrorDigestRole', {
      roleName: errorDigest.roleName,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.FederatedPrincipal(
        `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            'token.actions.githubusercontent.com:sub': errorDigest.subject,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      inlinePolicies: {
        ReadLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['logs:StartQuery'],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:${errorDigest.logGroupPrefix}*`,
              ],
            }),
            new iam.PolicyStatement({
              actions: ['logs:GetQueryResults', 'logs:DescribeLogGroups'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });
  }
}
