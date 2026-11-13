import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as fs from 'fs';
import * as path from 'path';
import { Duration, RemovalPolicy, Size, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import {
  certificates,
  domains,
  imageBucketNames,
  tableName,
  temporaryUploadsBucketName,
  trustedServiceApiKeyParameter,
  errorDigest,
} from './config';

const projectRoot = path.join(__dirname, '../..');
const serverRoot = path.join(projectRoot, 'server');
const sharpVersion: string = JSON.parse(
  fs.readFileSync(path.join(serverRoot, 'package.json'), 'utf8'),
).devDependencies.sharp;

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = dynamodb.Table.fromTableName(this, 'DocumentsTable', tableName);
    const temporaryUploads = s3.Bucket.fromBucketName(
      this,
      'TemporaryUploadsBucket',
      temporaryUploadsBucketName,
    );
    const trustedServiceApiKey = ssm.StringParameter.valueForStringParameter(
      this,
      trustedServiceApiKeyParameter,
    );

    const environment = {
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      ISA_DOCUMENTS_TABLE_NAME: tableName,
      TEMPORARY_UPLOADS_S3_BUCKET: temporaryUploadsBucketName,
      ISA_DOCUMENTS_TRUSTED_SERVICE_API_KEY: trustedServiceApiKey,
    };
    const bundling: nodejs.BundlingOptions = {
      sourceMap: true,
      target: 'node24',
      tsconfig: path.join(serverRoot, 'tsconfig.json'),
      externalModules: [],
      loader: { '.pdf': 'dataurl', '.ttf': 'dataurl' },
      define: { 'require.resolve': 'undefined' },
    };
    const functionProps = (name: string) => ({
      runtime: lambda.Runtime.NODEJS_24_X,
      handler: 'main',
      projectRoot,
      depsLockFilePath: path.join(projectRoot, 'pnpm-lock.yaml'),
      memorySize: 1024,
      environment,
      logGroup: new logs.LogGroup(this, `${name}Logs`, {
        retention: logs.RetentionDays.THREE_MONTHS,
        removalPolicy: RemovalPolicy.DESTROY,
      }),
    });

    const apiFunction = new nodejs.NodejsFunction(this, 'ApiFunction', {
      ...functionProps('ApiFunction'),
      entry: path.join(serverRoot, 'src/functions/api/handler.ts'),
      timeout: Duration.seconds(29),
      bundling,
    });

    // sharp ships a native binary per platform, so it is installed for the Lambda's linux-x64.
    const imageProcessorFunction = new nodejs.NodejsFunction(this, 'ImageProcessorFunction', {
      ...functionProps('ImageProcessorFunction'),
      entry: path.join(serverRoot, 'src/functions/image-processor-api/handler.ts'),
      timeout: Duration.seconds(29),
      bundling: {
        ...bundling,
        externalModules: ['sharp'],
        commandHooks: {
          beforeBundling: () => [],
          beforeInstall: () => [],
          afterBundling: (_inputDir: string, outputDir: string) => [
            `npm install --prefix "${outputDir}" --no-save --no-package-lock --os=linux --cpu=x64 --libc=glibc sharp@${sharpVersion}`,
          ],
        },
      },
    });

    for (const fn of [apiFunction, imageProcessorFunction]) {
      table.grantReadWriteData(fn);
      temporaryUploads.grantReadWrite(fn);
      fn.addToRolePolicy(
        new iam.PolicyStatement({
          actions: ['ssm:GetParameter', 'ssm:GetParameters'],
          resources: [`arn:aws:ssm:${this.region}:${this.account}:parameter/isa-tools*`],
        }),
      );
    }
    imageProcessorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject'],
        resources: imageBucketNames.map((name) => `arn:aws:s3:::${name}/public/*`),
      }),
    );

    const api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'isa-tools',
      cloudWatchRole: false,
      endpointConfiguration: { types: [apigateway.EndpointType.REGIONAL] },
      binaryMediaTypes: ['image/jpeg', 'image/png', 'image/webp'],
      minCompressionSize: Size.bytes(1024),
      deployOptions: { stageName: 'prod' },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowHeaders: [...apigateway.Cors.DEFAULT_HEADERS, 'x-api-key'],
      },
    });
    api.root
      .addResource('{proxy+}')
      .addMethod('ANY', new apigateway.LambdaIntegration(apiFunction));
    api.root
      .addResource('image-processor')
      .addResource('{proxy+}')
      .addMethod('ANY', new apigateway.LambdaIntegration(imageProcessorFunction), {
        apiKeyRequired: true,
      });

    const apiKey = api.addApiKey('TrustedServiceApiKey', {
      apiKeyName: 'isa-tools-trusted-service',
      value: trustedServiceApiKey,
    });
    api
      .addUsagePlan('TrustedServiceUsagePlan', { apiStages: [{ stage: api.deploymentStage }] })
      .addApiKey(apiKey);

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
    const distribution = new cloudfront.Distribution(this, 'WebDistribution', {
      defaultRootObject: 'index.html',
      domainNames: domains.web,
      certificate: acm.Certificate.fromCertificateArn(
        this,
        'WebCertificate',
        certificates.cloudfront,
      ),
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
      cacheControl: [s3deploy.CacheControl.fromString('public, max-age=86400')],
    });
    const webIndex = new s3deploy.BucketDeployment(this, 'WebIndex', {
      sources: [s3deploy.Source.asset(webDist, { exclude: ['*', '!index.html'] })],
      destinationBucket: webBucket,
      prune: false,
      cacheControl: [s3deploy.CacheControl.fromString('no-cache, no-store, must-revalidate')],
      distribution,
    });
    // index.html points at the hashed assets, so it may only go live after them.
    webIndex.node.addDependency(webAssets);

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
