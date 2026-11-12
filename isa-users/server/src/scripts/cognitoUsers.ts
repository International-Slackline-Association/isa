import { ListUsersCommand, type UserType } from '@aws-sdk/client-cognito-identity-provider';

import { cisProvider } from '../core/aws/clients';

export const getAllCognitoUsers = async () => {
  let paginationToken: any = undefined;
  const users: UserType[] = [];
  do {
    const result = await cisProvider.send(
      new ListUsersCommand({
        UserPoolId: process.env.USERPOOL_ID,
        PaginationToken: paginationToken,
      }),
    );

    paginationToken = result?.PaginationToken;
    users.push(...(result.Users ?? []));
  } while (paginationToken);
  return users.map((user) => ({
    username: user.Username,
    sub: user.Attributes?.find((attr) => attr.Name === 'sub')?.Value,
    email: user.Attributes?.find((attr) => attr.Name === 'email')?.Value,
    email_verified: user.Attributes?.find((attr) => attr.Name === 'email_verified')?.Value,
    createdDate: user.UserCreateDate,
  }));
};
