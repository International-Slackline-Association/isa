import { logger } from '../../logger';

export type IsaUser = {
  id: string;
  email?: string;
  fullname: string;
  profilePictureUrl?: string;
  country?: string;
};

type ApiUser = {
  isaId: string;
  email?: string;
  name?: string;
  surname?: string;
  country?: string;
  profilePictureUrl?: string;
};

let token: { value: string; expiresAt: number } | undefined;

const getToken = async () => {
  if (token && token.expiresAt > Date.now() + 60_000) return token.value;
  const credentials = Buffer.from(
    `${process.env.ISA_USERS_CLIENT_ID}:${process.env.ISA_USERS_CLIENT_SECRET}`,
  ).toString('base64');
  const response = await fetch(process.env.ISA_USERS_TOKEN_URL!, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) {
    throw new Error(`isa-users token request failed: ${response.status} ${await response.text()}`);
  }
  const body = (await response.json()) as { access_token: string; expires_in: number };
  token = { value: body.access_token, expiresAt: Date.now() + body.expires_in * 1000 };
  logger.info('isa-users token issued', { expiresIn: body.expires_in });
  return token.value;
};

// Up to 100 ids per call, the API's limit; unknown ids are left out.
export const fetchUsers = async (ids: string[]): Promise<IsaUser[]> => {
  const url = `${process.env.ISA_USERS_API_URL}/v1/users?ids=${ids.map(encodeURIComponent).join(',')}`;
  const response = await fetch(url, { headers: { Authorization: `Bearer ${await getToken()}` } });
  if (!response.ok) {
    throw new Error(`isa-users users request failed: ${response.status} ${await response.text()}`);
  }
  const { users } = (await response.json()) as { users: ApiUser[] };
  logger.info('isa-users users read', { requested: ids.length, found: users.length });
  return users.map((user) => ({
    id: user.isaId,
    email: user.email,
    fullname: `${user.name} ${user.surname}`,
    profilePictureUrl: user.profilePictureUrl,
    country: user.country,
  }));
};
