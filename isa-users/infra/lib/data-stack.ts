import * as backup from 'aws-cdk-lib/aws-backup';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { imagesBucketName, namespace, tableName } from './config';

export class DataStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const key = (name: string) => ({ name, type: dynamodb.AttributeType.STRING });
    const table = new dynamodb.Table(this, 'UsersTable', {
      tableName,
      partitionKey: key('PK'),
      sortKey: key('SK_GSI'),
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ddb_ttl',
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      deletionProtection: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });
    table.addLocalSecondaryIndex({ indexName: 'LSI', sortKey: key('LSI') });
    table.addLocalSecondaryIndex({ indexName: 'LSI2', sortKey: key('LSI2') });
    table.addGlobalSecondaryIndex({ indexName: 'GSI', partitionKey: key('SK_GSI'), sortKey: key('GSI_SK') });
    table.addGlobalSecondaryIndex({ indexName: 'GSI2', partitionKey: key('GSI2'), sortKey: key('GSI2_SK') });

    const plan = new backup.BackupPlan(this, 'BackupPlan', {
      backupPlanName: `${namespace}-monthly`,
      backupVault: backup.BackupVault.fromBackupVaultName(this, 'DefaultVault', 'Default'),
      backupPlanRules: [
        new backup.BackupPlanRule({
          ruleName: 'Monthly',
          scheduleExpression: events.Schedule.cron({ minute: '0', hour: '5', day: '1' }),
          deleteAfter: Duration.days(720),
        }),
      ],
    });
    plan.addSelection('Users', { resources: [backup.BackupResource.fromDynamoDbTable(table)] });

    // Read through CloudFront only; its bucket policy lives in the app stack with the distribution.
    new s3.Bucket(this, 'ImagesBucket', {
      bucketName: imagesBucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [{ noncurrentVersionExpiration: Duration.days(365) }],
      removalPolicy: RemovalPolicy.RETAIN,
    });
  }
}
