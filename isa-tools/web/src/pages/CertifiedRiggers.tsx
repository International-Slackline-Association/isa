import { useList } from '../api';
import { useDropdownFilter } from '../components/Filter';
import { Spinner } from '../components/Spinner';
import { Rigger } from '../types';

export function CertifiedRiggers() {
  const { data, isFetching } = useList<Rigger>('sheets/list/riggers');

  const { filteredItems, dropdown } = useDropdownFilter({
    label: 'Country',
    list: data?.map((row) => row.country),
    filterer: [data, 'country'],
  });

  return (
    <div className="stack">
      <div className="page-head">
        <p className="title">List of Certified Riggers</p>
        <div className="filters">{dropdown}</div>
      </div>
      {isFetching ? (
        <Spinner />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Country</th>
                <th>Expiration Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((row) => (
                <tr key={row.certId}>
                  <td>
                    <a href={`mailto:${row.email}`}>{row.name?.substring(0, 50)}</a>
                  </td>
                  <td>{row.country?.substring(0, 20)}</td>
                  <td>{row.expirationDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
