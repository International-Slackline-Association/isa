import { useMemo, useState } from 'react';

import { DropdownFilter } from '.';

interface Props<T, K extends keyof T> {
  label: string;
  list?: (string | undefined)[];
  filterer: [T[] | undefined, K];
}

export const useDropdownFilter = <T, K extends keyof T>(props: Props<T, K>) => {
  const [selectedValue, setSelectedValue] = useState<string>('All');

  const values = useMemo(() => {
    const trimmedList = (props.list?.map((item) => item?.trim()).filter((c) => c) ||
      []) as string[];
    return ['All', ...new Set(trimmedList.sort((a, b) => a?.localeCompare(b || '') || 0) || [])];
  }, [props.list]);

  const itemsToFilter = props.filterer[0];
  const filterKey = props.filterer[1];

  const filteredItems = useMemo(
    () =>
      itemsToFilter?.filter((p) => {
        if (selectedValue === 'All') return true;
        const v = p[filterKey];
        if (typeof v === 'string') {
          return v.trim() === selectedValue;
        }
        return v === selectedValue;
      }),
    [itemsToFilter, selectedValue, filterKey],
  );

  const label = props.label;

  const Dropdown = () => (
    <DropdownFilter
      label={label}
      selectedValue={selectedValue}
      onSelected={setSelectedValue}
      values={values}
    />
  );

  return {
    filteredItems,
    DropdownFilter: Dropdown,
  };
};

export const intersectAll = <T, _>(...items: (T[] | undefined)[]) => {
  return items.reduce((acc, curr) => {
    return acc?.filter((a) => curr?.some((b) => a === b));
  });
};
