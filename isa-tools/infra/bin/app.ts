#!/usr/bin/env node
import { App, Stack, Tags } from 'aws-cdk-lib';

import { AppStack } from '../lib/app-stack';
import { env } from '../lib/config';
import { DataStack } from '../lib/data-stack';

const app = new App();

const tag = (stack: Stack, name: string) => {
  Tags.of(stack).add('Namespace', 'isa-tools-prod');
  Tags.of(stack).add('Stage', 'prod');
  Tags.of(stack).add('StackName', name);
  Tags.of(stack).add('ManagedBy', 'cdk');
};

tag(new DataStack(app, 'IsaToolsData', { env, terminationProtection: true }), 'data');
tag(new AppStack(app, 'IsaToolsApp', { env }), 'app');
