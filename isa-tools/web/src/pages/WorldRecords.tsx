import { useList } from '../api';
import { intersectAll, useDropdownFilter } from '../components/Filter';
import { Links } from '../components/Links';
import { Spinner } from '../components/Spinner';
import { WorldRecord } from '../types';

export function WorldRecords() {
  const { data, isFetching } = useList<WorldRecord>('sheets/list/world-records');

  const genderFilter = useDropdownFilter({
    label: 'Gender',
    list: data?.map((row) => row.category),
    filterer: [data, 'category'],
  });

  const countryFilter = useDropdownFilter({
    label: 'Country',
    list: data?.map((row) => row.country),
    filterer: [data, 'country'],
  });

  const extraFilter = useDropdownFilter({
    label: 'Extra',
    list: data?.map((row) => row.extra),
    filterer: [data, 'extra'],
  });

  const typeOfRecordFilter = useDropdownFilter({
    label: 'Type of Record',
    list: data?.map((row) => row.typeOfRecord),
    filterer: [data, 'typeOfRecord'],
  });

  const typeOfLineFilter = useDropdownFilter({
    label: 'Type of Line',
    list: data?.map((row) => row.typeOfLine),
    filterer: [data, 'typeOfLine'],
  });

  const filteredItems = intersectAll(
    genderFilter.filteredItems,
    countryFilter.filteredItems,
    extraFilter.filteredItems,
    typeOfRecordFilter.filteredItems,
    typeOfLineFilter.filteredItems,
  );

  return (
    <div className="stack">
      <div className="filters end">
        {genderFilter.dropdown}
        {countryFilter.dropdown}
        {extraFilter.dropdown}
        {typeOfRecordFilter.dropdown}
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
                <th>Record</th>
                <th>Name</th>
                <th>Country</th>
                <th>Specs</th>
                <th>Links</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((row) => (
                <tr key={row.certId}>
                  <td>{row.date}</td>
                  <td style={{ width: '30%' }}>{row.recordType}</td>
                  <td>{row.name}</td>
                  <td>{row.country}</td>
                  <td>{row.specs}</td>
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
