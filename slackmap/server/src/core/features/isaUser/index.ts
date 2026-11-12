import { db } from '../../db';
import { SimpleCache } from '../../utils/cache';

type UserDetailType = Awaited<ReturnType<typeof db.isaUsersDb.getUserDetails>>;

const usersCache = new SimpleCache<UserDetailType>(10);

export const getUserDetails = async (userId: string, opts: { includeEmail?: boolean } = {}) => {
  let user = usersCache.get(userId);
  if (!user) {
    user = await db.isaUsersDb.getUserDetails(userId);
    usersCache.set(userId, user);
  }
  if (!user) return user;
  return { ...user, email: opts.includeEmail ? user.email : undefined };
};

export const checkUserExists = async (userId: string) => {
  const user = await getUserDetails(userId);
  if (user) return true;
  throw new Error(`NotFound: User ${userId} not found`);
};

export const getMultipleUserDetails = async (userIds: string[]) => {
  const users = await Promise.all(userIds.map((u) => getUserDetails(u)));

  const userDict = users.reduce(
    (acc, user) => {
      if (!user) return acc;
      acc[user.id] = user;
      return acc;
    },
    {} as Record<string, UserDetailType>,
  );
  return userDict;
};
