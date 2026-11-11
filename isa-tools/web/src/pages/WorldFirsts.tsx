import { useList } from '../api';
import { intersectAll, useDropdownFilter } from '../components/Filter';
import { Links } from '../components/Links';
import { Spinner } from '../components/Spinner';
import { WorldFirst } from '../types';

export function WorldFirsts() {
  const { data, isFetching } = useList<WorldFirst>('sheets/list/world-firsts');

  const categoryFilter = useDropdownFilter({
    label: 'Category',
    list: data?.map((row) => row.category),
    filterer: [data, 'category'],
  });

  const countryFilter = useDropdownFilter({
    label: 'Country',
    list: data?.map((row) => row.country),
    filterer: [data, 'country'],
  });

  const typeOfLineFilter = useDropdownFilter({
    label: 'Type of Line',
    list: data?.map((row) => row.typeOfLine),
    filterer: [data, 'typeOfLine'],
  });

  const filteredItems = intersectAll(
    categoryFilter.filteredItems,
    countryFilter.filteredItems,
    typeOfLineFilter.filteredItems,
  );

  return (
    <div className="stack">
      <div className="filters end">
        {categoryFilter.dropdown}
        {countryFilter.dropdown}
        {typeOfLineFilter.dropdown}
      </div>
      {isFetching ? (
        <Spinner />
      ) : (
        <div className="table-container">
          <table className="small">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Name</th>
                <th>Country</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((row) => (
                <tr key={row.certId}>
                  <td>{row.date}</td>
                  <td style={{ width: '30%' }}>{row.description}</td>
                  <td>{row.name}</td>
                  <td>{row.country}</td>
                  <td>
                    <Links link1={row.link1} link2={row.link2} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
