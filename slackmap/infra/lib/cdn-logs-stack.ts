import * as logs from 'aws-cdk-lib/aws-logs';
import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

import { cdnAccessLogGroupName, distributionIds, namespace } from './config';

// No client IP, cookie, port or query: those identify a person.
const recordFields = [
  'timestamp(ms)',
  'x-host-header',
  'cs-method',
  'cs-uri-stem',
  'sc-status',
  'sc-bytes',
  'time-taken',
  'x-edge-location',
  'x-edge-result-type',
  'c-country',
  'asn',
  'cs(Referer)',
  'cs(User-Agent)',
];

export class CdnLogsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const logGroup = new logs.LogGroup(this, 'CdnAccessLogs', {
      logGroupName: cdnAccessLogGroupName,
      retention: logs.RetentionDays.SIX_MONTHS,
      logGroupClass: logs.LogGroupClass.INFREQUENT_ACCESS,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const destination = new logs.CfnDeliveryDestination(this, 'CdnAccessDestination', {
      name: `${namespace}-cdn-access`,
      outputFormat: 'json',
      destinationResourceArn: `arn:aws:logs:${this.region}:${this.account}:log-group:${cdnAccessLogGroupName}`,
    });
    destination.node.addDependency(logGroup);

    const dataSource = new logs.CfnDeliverySource(this, 'DataAccessSource', {
      name: `${namespace}-data-access`,
      logType: 'ACCESS_LOGS',
      resourceArn: `arn:aws:cloudfront::${this.account}:distribution/${distributionIds.data}`,
    });
    const dataDelivery = new logs.CfnDelivery(this, 'DataAccessDelivery', {
      deliverySourceName: dataSource.name,
      deliveryDestinationArn: destination.attrArn,
      recordFields,
    });
    dataDelivery.node.addDependency(dataSource);

    const imagesSource = new logs.CfnDeliverySource(this, 'ImagesAccessSource', {
      name: `${namespace}-images-access`,
      logType: 'ACCESS_LOGS',
      resourceArn: `arn:aws:cloudfront::${this.account}:distribution/${distributionIds.images}`,
    });
    const imagesDelivery = new logs.CfnDelivery(this, 'ImagesAccessDelivery', {
      deliverySourceName: imagesSource.name,
      deliveryDestinationArn: destination.attrArn,
      recordFields,
    });
    imagesDelivery.node.addDependency(imagesSource);
    // Two deliveries created at once on one destination can conflict.
    imagesDelivery.node.addDependency(dataDelivery);
  }
}
