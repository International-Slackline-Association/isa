#!/usr/bin/env node
import { App, Stack, StackProps, Tags } from 'aws-cdk-lib';

import { AppStack } from '../lib/app-stack';
import { CdnLogsStack } from '../lib/cdn-logs-stack';
import { env, isProd, namespace, stage, tableStreamArn, usEast1Env } from '../lib/config';
import { DataStack } from '../lib/data-stack';

const app = new App();

const tag = (stack: Stack, name: string) => {
  Tags.of(stack).add('Namespace', namespace);
  Tags.of(stack).add('Stage', stage);
  Tags.of(stack).add('StackName', name);
  Tags.of(stack).add('ManagedBy', 'cdk');
  return stack;
};
const props = (extra: StackProps = {}): StackProps => ({ env, ...extra });

tag(new DataStack(app, `${namespace}-data`, props({ terminationProtection: isProd })), 'data');
// A new stage deploys its data stack first; the app stack needs the table's stream ARN from it.
if (tableStreamArn) tag(new AppStack(app, `${namespace}-app`, props()), 'app');
if (isProd) tag(new CdnLogsStack(app, `${namespace}-cdn-logs`, { env: usEast1Env }), 'cdn-logs');
