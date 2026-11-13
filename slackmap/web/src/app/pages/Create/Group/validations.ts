import { Feature } from 'geojson';

import { GroupDetailsForm, groupLinkFields } from './types';

export const validateGroupFeatures = (features: Feature[]): string[] => {
  if (features.length === 0) {
    return ['You need to put a point where the group meets'];
  }
  if (features.length > 1 || features[0].geometry?.type !== 'Point') {
    return ['Only 1 point is allowed'];
  }
  return [];
};

export const cleanGroupValues = (values: GroupDetailsForm) => {
  const text = (v?: string) => v?.trim() || undefined;
  const link = (v?: string) => {
    const t = text(v);
    return t && !/^https?:\/\//i.test(t) ? `https://${t}` : t;
  };
  const links = Object.fromEntries(
    groupLinkFields.map(({ field }) => [field, link(values[field])]),
  ) as Pick<GroupDetailsForm, (typeof groupLinkFields)[number]['field']>;
  return {
    name: values.name.trim(),
    email: text(values.email),
    ...links,
    isaMemberType: values.isaMemberType || undefined,
    isaMemberInfoUrl: values.isaMemberType ? link(values.isaMemberInfoUrl) : undefined,
  };
};

export const validateGroupValues = (values: GroupDetailsForm) => {
  const errors: Partial<Record<keyof GroupDetailsForm, string>> = {};
  const cleaned = cleanGroupValues(values);
  if (!cleaned.name) errors.name = 'Required';
  if (cleaned.email && !/^[^\s@?&]+@[^\s@?&]+\.[^\s@?&]{2,}$/.test(cleaned.email)) {
    errors.email = 'Not a valid email';
  }
  for (const { field } of [...groupLinkFields, { field: 'isaMemberInfoUrl' as const }]) {
    const value = cleaned[field];
    if (!value) continue;
    try {
      new URL(value);
    } catch {
      errors[field] = 'Not a valid link';
    }
  }
  if (!cleaned.email && groupLinkFields.every(({ field }) => !cleaned[field])) {
    errors.email = 'Add at least one way to reach the group';
  }
  return errors;
};
