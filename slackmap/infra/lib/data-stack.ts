import * as backup from 'aws-cdk-lib/aws-backup';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { applicationDataBucketName, imagesBucketName, namespace, tableName } from './config';

export class DataStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const key = (name: string) => ({ name, type: dynamodb.AttributeType.STRING });
    const table = new dynamodb.Table(this, 'Table', {
      tableName,
      partitionKey: key('PK'),
      sortKey: key('SK_GSI'),
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ddb_ttl',
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      deletionProtection: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    table.addLocalSecondaryIndex({ indexName: 'LSI', sortKey: key('LSI') });
    table.addLocalSecondaryIndex({ indexName: 'LSI2', sortKey: key('LSI2') });
    table.addGlobalSecondaryIndex({ indexName: 'GSI', partitionKey: key('SK_GSI'), sortKey: key('GSI_SK') });
    table.addGlobalSecondaryIndex({
      indexName: 'GSI2',
      partitionKey: key('GSI2'),
      sortKey: key('GSI2_SK'),
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['GSI3', 'GSI_SK', 'GSI3_SK'],
    });
    table.addGlobalSecondaryIndex({
      indexName: 'GSI3',
      partitionKey: key('GSI3'),
      sortKey: key('GSI3_SK'),
      projectionType: dynamodb.ProjectionType.INCLUDE,
      nonKeyAttributes: ['GSI_SK', 'GSI2', 'GSI2_SK'],
    });

    const plan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: `${namespace}-monthly`,
      backupVault: backup.BackupVault.fromBackupVaultName(this, 'DefaultVault', 'Default'),
      backupPlanRules: [
        new backup.BackupPlanRule({
          ruleName: 'Monthly',
          scheduleExpression: events.Schedule.cron({ minute: '0', hour: '5', day: '1' }),
          deleteAfter: Duration.days(365),
        }),
      ],
    });
    plan.addSelection('Table', { resources: [backup.BackupResource.fromDynamoDbTable(table)] });

    // Both are read through CloudFront only; their bucket policies live in the app stack with the distributions.
    // The web app reads them cross-origin.
    const cors: s3.CorsRule[] = [
      { allowedMethods: [s3.HttpMethods.GET], allowedOrigins: ['*'], allowedHeaders: ['*'], maxAge: 3600 },
    ];
    new s3.Bucket(this, 'ImagesBucket', {
      bucketName: imagesBucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      cors,
      lifecycleRules: [{ noncurrentVersionExpiration: Duration.days(365) }],
      removalPolicy: RemovalPolicy.RETAIN,
    });
    new s3.Bucket(this, 'ApplicationDataBucket', {
      bucketName: applicationDataBucketName,
      cors,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
