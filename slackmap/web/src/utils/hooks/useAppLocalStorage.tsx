import { useCallback, useState } from 'react';

interface AppLocalStorage {
  'tutorial.welcomeSeen': boolean;
  'tutorial.createLineSeen': boolean;
  'mapSettings.mapStyle': 'default' | 'satellite' | 'outdoors' | 'streets';
  'activity.lastSeenChangelogDate': string;
}

const keyPrefix = 'app.';

export const useAppLocalStorage = <Key extends keyof AppLocalStorage>(
  key: Key,
  initialValue: AppLocalStorage[Key],
) => {
  const storageKey = `${keyPrefix}${key}`;

  const [value, setValue] = useState<AppLocalStorage[Key]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
      if (initialValue) {
        localStorage.setItem(storageKey, JSON.stringify(initialValue));
      }
      return initialValue;
    } catch (error) {
      console.warn('Local storage read failed', storageKey, error);
      return initialValue;
    }
  });

  const set = useCallback(
    (newValue: AppLocalStorage[Key]) => {
      const serialized = JSON.stringify(newValue);
      setValue(JSON.parse(serialized));
      try {
        localStorage.setItem(storageKey, serialized);
      } catch (error) {
        console.warn('Local storage write failed', storageKey, error);
      }
    },
    [storageKey],
  );

  return { value, set };
};
