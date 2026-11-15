import { SimpleCache } from '../../utils/cache';
import { IsaUser, fetchUsers } from './api';

// Wrapped, so a user known not to exist is cached too: SimpleCache returns null for a miss.
const usersCache = new SimpleCache<{ user: IsaUser | null }>(10);
const maxIdsPerCall = 100;

const getUsers = async (userIds: string[]) => {
  const missing = [...new Set(userIds)].filter((id) => !usersCache.get(id));
  for (let i = 0; i < missing.length; i += maxIdsPerCall) {
    const chunk = missing.slice(i, i + maxIdsPerCall);
    const found = await fetchUsers(chunk);
    for (const id of chunk) usersCache.set(id, { user: found.find((user) => user.id === id) ?? null });
  }
  return userIds.map((id) => usersCache.get(id)?.user ?? null);
};

export const getUserDetails = async (userId: string, opts: { includeEmail?: boolean } = {}) => {
  const [user] = await getUsers([userId]);
  if (!user) return user;
  return { ...user, email: opts.includeEmail ? user.email : undefined };
};

export const checkUserExists = async (userId: string) => {
  const user = await getUserDetails(userId);
  if (user) return true;
  throw new Error(`NotFound: User ${userId} not found`);
};

export const getMultipleUserDetails = async (userIds: string[]) => {
  const users = await getUsers(userIds);
  const userDict = users.reduce(
    (acc, user) => {
      if (!user) return acc;
      acc[user.id] = { ...user, email: undefined };
      return acc;
    },
    {} as Record<string, IsaUser>,
  );
  return userDict;
};
