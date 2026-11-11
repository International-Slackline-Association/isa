import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ses from 'aws-cdk-lib/aws-ses';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { shared } from '../config/organization';
import { wildcardCertificate } from './wildcard-certificate';

// ISA-wide resources in eu-central-1: the SES sending domain (used by
// Cognito, isa-users and slackmap) and the wildcard certificate of the
// account- and tools-API custom domains. Imported from existing resources:
// keep construct IDs and properties as they are.
export class SharedStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // DKIM keys are deliberately not modelled: an update must never rotate
    // them, the CNAMEs at Cloudflare would break.
    const sesDomain = new ses.CfnEmailIdentity(this, 'SesDomainIdentity', {
      emailIdentity: shared.domain,
      dkimAttributes: { signingEnabled: true },
      feedbackAttributes: { emailForwardingEnabled: true },
      mailFromAttributes: { behaviorOnMxFailure: 'USE_DEFAULT_VALUE' },
    });
    sesDomain.applyRemovalPolicy(RemovalPolicy.RETAIN);

    // SES points its bounce and complaint notifications at this topic by hand
    // (classic identity notifications have no CloudFormation model).
    const sesNotifications = new sns.Topic(this, 'SesNotificationsTopic', {
      displayName: 'ISA SES bounces and complaints',
    });
    sesNotifications.applyRemovalPolicy(RemovalPolicy.RETAIN);
    sesNotifications.addSubscription(new subscriptions.EmailSubscription(shared.notificationEmail));
    sesNotifications.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('ses.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [sesNotifications.topicArn],
        conditions: {
          ArnLike: { 'aws:SourceArn': `arn:aws:ses:${this.region}:${this.account}:identity/${shared.domain}*` },
        },
      }),
    );

    wildcardCertificate(this);
  }
}
