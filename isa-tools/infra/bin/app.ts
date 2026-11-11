#!/usr/bin/env node
import { App } from 'aws-cdk-lib';

import { AppStack } from '../lib/app-stack';
import { env } from '../lib/config';
import { DataStack } from '../lib/data-stack';

const app = new App();

new DataStack(app, 'IsaToolsData', { env, terminationProtection: true });
new AppStack(app, 'IsaToolsApp', { env });
