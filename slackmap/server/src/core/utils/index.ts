import { createHash } from 'crypto';

type NullablePartial<T> = {
  [P in keyof T]?: T[P] | null;
};

export const assignFromSourceToTarget = <T>(target: NullablePartial<T>, source: T): T => {
  const result = structuredClone(target) as Record<string, unknown>;
  const sourceCopy = structuredClone(source) as Record<string, unknown>;
  for (const key of Object.keys(sourceCopy)) {
    const targetValue = result[key];
    if (targetValue === undefined) {
      result[key] = sourceCopy[key];
    } else if (targetValue === null) {
      result[key] = undefined;
    }
  }
  return result as T;
};

export const generateISAIdFromUsername = (username: string) => {
  const hash = createHash('sha256').update(username).digest('hex');
  return `ISA_${hash.substring(0, 8)}`.toUpperCase();
};
