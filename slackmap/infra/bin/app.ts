#!/usr/bin/env node
import { App, Stack, StackProps, Tags } from 'aws-cdk-lib';

import { AppStack } from '../lib/app-stack';
import { CdnLogsStack } from '../lib/cdn-logs-stack';
import { env, namespace, stage, usEast1Env } from '../lib/config';
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

tag(new DataStack(app, `${namespace}-data`, props({ terminationProtection: true })), 'data');
tag(new AppStack(app, `${namespace}-app`, props()), 'app');
tag(new CdnLogsStack(app, `${namespace}-cdn-logs`, { env: usEast1Env }), 'cdn-logs');
