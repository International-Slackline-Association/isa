// pnpm run script createUser --email <email> --name <name> --surname <surname>
import { AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { parseArgs } from 'node:util';

import { cisProvider } from '../core/aws/clients';

export default async (args: string[]) => {
  const { values } = parseArgs({
    args,
    options: {
      email: { type: 'string' },
      name: { type: 'string' },
      surname: { type: 'string' },
    },
  });
  const { email, name, surname } = values;
  if (!email || !name || !surname) {
    throw new Error('Missing arguments: --email, --name, --surname');
  }

  await cisProvider.send(
    new AdminCreateUserCommand({
      Username: email,
      UserPoolId: process.env.USERPOOL_ID,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'name', Value: name },
        { Name: 'family_name', Value: surname },
        { Name: 'custom:identityType', Value: 'individual' },
      ],
    }),
  );
};
