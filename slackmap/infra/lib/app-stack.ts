import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { Annotations, Duration, RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  applicationDataBucketName,
  certificates,
  domains,
  errorDigest,
  geonamesUsernameParameter,
  imagesBucketName,
  isaTools,
  isaUsers,
  namespace,
  sesIdentityArn,
  slackmapAdminIsaId,
  stage,
  tableName,
  tableStreamArn,
} from './config';

const projectRoot = path.join(__dirname, '../..');
const serverRoot = path.join(projectRoot, 'server');

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = dynamodb.Table.fromTableAttributes(this, 'Table', {
      tableName,
      tableStreamArn,
      globalIndexes: ['GSI', 'GSI2', 'GSI3'],
      localIndexes: ['LSI', 'LSI2'],
    });
    const usersTable = dynamodb.Table.fromTableName(this, 'UsersTable', isaUsers.tableName);
    const imagesBucket = s3.Bucket.fromBucketName(this, 'ImagesBucket', imagesBucketName);
    const applicationDataBucket = s3.Bucket.fromBucketName(
      this,
      'ApplicationDataBucket',
      applicationDataBucketName,
    );
    const cloudfrontCertificate = acm.Certificate.fromCertificateArn(
      this,
      'CloudFrontCertificate',
      certificates.cloudfront,
    );

    const environment = {
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      SLACKMAP_TABLE_NAME: tableName,
      USERS_TABLE_NAME: isaUsers.tableName,
      ISA_USER_POOL_ID: isaUsers.userPoolId,
      SLACKMAP_CLIENT_ID: isaUsers.slackmapClientId,
      SLACKMAP_APPLICATION_DATA_S3_BUCKET: applicationDataBucketName,
      SLACKMAP_IMAGES_S3_BUCKET: imagesBucketName,
      SLACKMAP_ADMIN_ISA_ID: slackmapAdminIsaId,
      ISA_TOOLS_TRUSTED_SERVICE_API_KEY: ssm.StringParameter.valueForStringParameter(
        this,
        isaTools.trustedServiceApiKeyParameter,
      ),
      GEONAMES_API_USERNAME: ssm.StringParameter.valueForStringParameter(
        this,
        geonamesUsernameParameter,
      ),
    };
    const fn = (name: string, entry: string, timeout: Duration) =>
      new nodejs.NodejsFunction(this, name, {
        runtime: lambda.Runtime.NODEJS_24_X,
        handler: 'main',
        entry: path.join(serverRoot, entry),
        projectRoot,
        depsLockFilePath: path.join(projectRoot, 'pnpm-lock.yaml'),
        memorySize: 1024,
        timeout,
        environment,
        bundling: {
          sourceMap: true,
          target: 'node24',
          tsconfig: path.join(serverRoot, 'tsconfig.json'),
          externalModules: [],
        },
        logGroup: new logs.LogGroup(this, `${name}Logs`, {
          retention: logs.RetentionDays.SIX_MONTHS,
          removalPolicy: RemovalPolicy.DESTROY,
        }),
      });

    const apiFunction = fn('ApiFunction', 'src/functions/api/handler.ts', Duration.seconds(10));
    const streamsFunction = fn(
      'StreamsFunction',
      'src/functions/ddb-streams/handler.ts',
      Duration.seconds(30),
    );
    const cronFunction = fn('CronFunction', 'src/functions/cronJob/handler.ts', Duration.seconds(180));

    // LATEST: the items copied in before this stack existed must not replay their side effects.
    streamsFunction.addEventSource(
      new eventSources.DynamoEventSource(table, {
        startingPosition: lambda.StartingPosition.LATEST,
        batchSize: 10,
      }),
    );
    new events.Rule(this, 'WeeklyRefresh', {
      schedule: events.Schedule.cron({ minute: '0', hour: '2', weekDay: 'MON' }),
      targets: [new targets.LambdaFunction(cronFunction)],
    });

    for (const f of [apiFunction, streamsFunction, cronFunction]) {
      table.grantReadWriteData(f);
      usersTable.grantReadData(f);
      imagesBucket.grantReadWrite(f);
      applicationDataBucket.grantReadWrite(f);
      f.addToRolePolicy(
        new iam.PolicyStatement({ actions: ['ses:SendEmail'], resources: [sesIdentityArn] }),
      );
    }

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: namespace,
      cloudWatchRole: false,
      endpointConfiguration: { types: [apigateway.EndpointType.REGIONAL] },
      minCompressionSize: Size.bytes(1024),
      deployOptions: { stageName: stage },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: [...apigateway.Cors.DEFAULT_HEADERS, 'X-Amz-User-Agent'],
      },
    });
    api.root.addResource('{proxy+}').addMethod('ANY', new apigateway.LambdaIntegration(apiFunction));

    // The custom domain itself is managed by hand.
    new apigateway.CfnBasePathMapping(this, 'ApiDomainMapping', {
      domainName: domains.api,
      restApiId: api.restApiId,
      stage: api.deploymentStage.stageName,
    });

    // Signed-in users upload pictures straight to isa-tools' temporary-uploads bucket; the API then
    // has them resized into the images bucket.
    const uploadsIdentityPool = new cognito.CfnIdentityPool(this, 'UploadsIdentityPool', {
      identityPoolName: `${namespace.replace(/-/g, '_')}_uploads`,
      allowUnauthenticatedIdentities: false,
      cognitoIdentityProviders: [
        {
          clientId: isaUsers.slackmapClientId,
          providerName: `cognito-idp.${this.region}.amazonaws.com/${isaUsers.userPoolId}`,
        },
      ],
    });
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
              resources: [`arn:aws:s3:::${isaTools.temporaryUploadsBucketName}/public/*`],
            }),
          ],
        }),
      },
    });
    new cognito.CfnIdentityPoolRoleAttachment(this, 'UploadsRoleAttachment', {
      identityPoolId: uploadsIdentityPool.ref,
      roles: { authenticated: uploadsRole.roleArn },
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
      domainNames: domains.web,
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
      memoryLimit: 1024,
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

    // The buckets are imported, so CDK cannot add the read grant for their distributions itself.
    const publicRead = (name: string, bucket: s3.IBucket, distribution: cloudfront.Distribution) => {
      Annotations.of(distribution).acknowledgeWarning(
        '@aws-cdk/aws-cloudfront-origins:updateImportedBucketPolicyOac',
      );
      new s3.BucketPolicy(this, `${name}BucketPolicy`, { bucket }).document.addStatements(
        new iam.PolicyStatement({
          principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
          actions: ['s3:GetObject'],
          resources: [bucket.arnForObjects('*')],
          conditions: {
            StringEquals: {
              'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
            },
          },
        }),
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:*'],
          resources: [bucket.bucketArn, bucket.arnForObjects('*')],
          conditions: { Bool: { 'aws:SecureTransport': 'false' } },
        }),
      );
    };

    const imagesDistribution = new cloudfront.Distribution(this, 'ImagesDistribution', {
      domainNames: [domains.images],
      certificate: cloudfrontCertificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(imagesBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      },
    });
    publicRead('Images', imagesBucket, imagesDistribution);

    // The geojson is rewritten by the stream handler and the weekly job, so it is not cached; the web app
    // fetches it cross-origin.
    const dataDistribution = new cloudfront.Distribution(this, 'DataDistribution', {
      domainNames: [domains.data],
      certificate: cloudfrontCertificate,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(applicationDataBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.CORS_S3_ORIGIN,
        responseHeadersPolicy: cloudfront.ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS,
        compress: false,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      },
    });
    publicRead('ApplicationData', applicationDataBucket, dataDistribution);

    // In front of the API so each request carries the viewer's country and network.
    new cloudfront.Distribution(this, 'ApiDistribution', {
      domainNames: [domains.api],
      certificate: cloudfrontCertificate,
      defaultBehavior: {
        origin: new origins.RestApiOrigin(api),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
        cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        compress: false,
      },
    });

    const githubOidcProvider = `arn:aws:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`;
    new iam.Role(this, 'ErrorDigestRole', {
      roleName: errorDigest.roleName,
      maxSessionDuration: Duration.hours(1),
      assumedBy: new iam.FederatedPrincipal(
        githubOidcProvider,
        {
          StringEquals: {
            'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
            'token.actions.githubusercontent.com:sub': `repo:${errorDigest.repo}:ref:refs/heads/main`,
          },
        },
        'sts:AssumeRoleWithWebIdentity',
      ),
      inlinePolicies: {
        ReadLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ['logs:StartQuery'],
              resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:${namespace}-app-*`],
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
