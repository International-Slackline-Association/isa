import { DDBTableKeyAttrs } from '../types';

interface ParsedKeyAttrs {
  hash: string;
}
interface NonKeyAttrs {
  ddb_ttl?: number;
  value: string;
  description?: string;
  createdDate?: string;
}

export type DDBGenericHashItem = ParsedKeyAttrs & NonKeyAttrs;
export type DDBGenericHashAttrs = DDBTableKeyAttrs & NonKeyAttrs;
