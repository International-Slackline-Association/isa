import * as crypto from 'crypto';

const hasValue = (v: any) => {
  return v !== null && v !== undefined;
};

export const assignExistingFields = <T extends object, U extends object>(obj1: T, obj2: U): T => {
  const v = structuredClone(obj1) as Record<string, unknown>;
  for (const [key, value] of Object.entries(obj2)) {
    if (hasValue(value)) {
      v[key] = value;
    }
  }
  return v as T;
};

export const generateISAIdFromUsername = (username: string) => {
  const hash = crypto.createHash('sha256').update(username).digest('hex');
  return `ISA_${hash.substring(0, 8)}`.toUpperCase();
};

export const hashValue = (value: string) => {
  const hash = crypto.createHash('sha256').update(value).digest('hex');
  return hash.substring(0, 8);
};
