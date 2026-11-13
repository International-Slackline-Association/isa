import * as db from '../../../core/db';
import { logger } from '../../../core/logger';
import { assignExistingFields } from '../../../core/utils';
import { deleteProfilePhoto, processAndPutProfilePhoto } from '../../../core/utils/images-processing';
import type { Request } from '../../http';
import { jsonRoute, validateUserExists } from '../utils';
import type { UpdateProfilePicturePostBody, UpdateUserPostBody } from './types';

export const getUserDetails = async (request: Request) => {
  const user = await db.getUser(request.user!.isaId);
  return user;
};

export const updateUser = async (request: Request) => {
  const { name, surname, birthDate, city, country, gender, phoneNumber } =
    request.body as UpdateUserPostBody;
  const user = await validateUserExists(request.user!.isaId);
  const updatedUser = assignExistingFields(user, {
    name,
    surname,
    birthDate,
    city,
    country,
    gender,
    phoneNumber,
  });
  await db.putUser(updatedUser);
  logger.info('User updated', { isaId: user.userId });
  return {};
};

export const updateUserProfilePicture = async (request: Request) => {
  const body = request.body as UpdateProfilePicturePostBody;
  const user = await validateUserExists(request.user!.isaId);
  const previousKey = user.profilePictureS3Key;
  if (!body.processingBucketKey) {
    delete user.profilePictureS3Key;
    await db.putUser(user);
  } else {
    const { s3Key } = await processAndPutProfilePhoto(body.processingBucketKey, request.user!.isaId);
    user.profilePictureS3Key = s3Key;
    await db.putUser(user);
  }
  if (previousKey) await deleteProfilePhoto(previousKey);
  logger.info('User profile picture updated', {
    isaId: user.userId,
    previousPictureDeleted: Boolean(previousKey),
  });
  return {};
};

export const userRoutes = {
  'GET /user/details': jsonRoute(getUserDetails),
  'PUT /user/details': jsonRoute(updateUser),
  'PUT /user/profilePicture': jsonRoute(updateUserProfilePicture),
};
