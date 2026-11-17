import { DDBTableKeyAttrs } from '../../types';

interface ParsedKeyAttrs {
  userId: string;
  email: string;
}
interface NonKeyAttrs {
  cognitoSub: string;
  cognitoUsername: string;
  name?: string;
  surname?: string;
  gender?: 'm' | 'f' | 'o';
  birthDate?: string;
  phoneNumber?: string;
  city?: string;
  country?: string;
  profilePictureS3Key?: string;
  createdDateTime?: string;
  verificationEmails?: { day: string; count: number };
}

export type DDBUserDetailItem = ParsedKeyAttrs & NonKeyAttrs;
export type DDBUserDetailAttrs = DDBTableKeyAttrs & NonKeyAttrs;
