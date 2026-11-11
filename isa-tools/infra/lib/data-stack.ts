import * as backup from 'aws-cdk-lib/aws-backup';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Duration, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { tableName, temporaryUploadsBucketName } from './config';

export class DataStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const table = new dynamodb.Table(this, 'DocumentsTable', {
      tableName,
      partitionKey: { name: 'PK', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'SK_GSI', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ddb_ttl',
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      deletionProtection: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    const plan = new backup.BackupPlan(this, 'BackupPlan', {
      backupVault: backup.BackupVault.fromBackupVaultName(this, 'DefaultVault', 'Default'),
      backupPlanRules: [
        new backup.BackupPlanRule({
          ruleName: 'Monthly',
          scheduleExpression: events.Schedule.cron({ minute: '0', hour: '5', day: '1' }),
          deleteAfter: Duration.days(720),
        }),
      ],
    });
    plan.addSelection('Documents', { resources: [backup.BackupResource.fromDynamoDbTable(table)] });

    new s3.Bucket(this, 'TemporaryUploadsBucket', {
      bucketName: temporaryUploadsBucketName,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      cors: [
        {
          allowedHeaders: ['*'],
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.HEAD,
            s3.HttpMethods.PUT,
            s3.HttpMethods.POST,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'],
          exposedHeaders: [
            'x-amz-server-side-encryption',
            'x-amz-request-id',
            'x-amz-id-2',
            'ETag',
          ],
          maxAge: 3000,
        },
      ],
      lifecycleRules: [{ expiration: Duration.days(90) }],
    });
  }
}
