import { useList } from '../api';
import { DetailLabel, ExternalLink, useDetailDialog } from '../components/DetailDialog';
import { intersectAll, useDropdownFilter } from '../components/Filter';
import { Icon } from '../components/Icons';
import { Spinner } from '../components/Spinner';
import { EquipmentWarning } from '../types';

export function EquipmentWarnings() {
  const { data, isFetching } = useList<EquipmentWarning>('sheets/list/equipment-warnings');
  const { dialog, showDetails } = useDetailDialog();

  const productTypeFilter = useDropdownFilter({
    label: 'Product Type',
    list: data?.map((row) => row.productType),
    filterer: [data, 'productType'],
  });

  const manufacturerFilter = useDropdownFilter({
    label: 'Manufacturer',
    list: data?.map((row) => row.manufacturer),
    filterer: [data, 'manufacturer'],
  });

  const filteredItems = intersectAll(
    productTypeFilter.filteredItems,
    manufacturerFilter.filteredItems,
  );

  return (
    <div className="stack">
      <div className="page-head">
        <p className="title">Warnings and recalls for slackline equipment</p>
        <div className="filters">
          {productTypeFilter.dropdown}
          {manufacturerFilter.dropdown}
        </div>
      </div>
      {dialog}
      {isFetching ? (
        <Spinner />
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th />
                <th>Status</th>
                <th>Manufacturer</th>
                <th>Model</th>
                <th>Product Type</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((row) => (
                <tr key={row.id}>
                  <td>
                    <button
                      className="icon-button"
                      aria-label="Details"
                      onClick={() =>
                        showDetails({
                          title: `${row.manufacturer} - ${row.model}`,
                          content: <Details row={row} />,
                        })
                      }
                    >
                      <Icon name="zoomIn" />
                    </button>
                  </td>
                  <td>
                    <p
                      className="status"
                      style={{
                        color:
                          row.status === 'Warning'
                            ? 'orange'
                            : row.status === 'Recall'
                              ? 'red'
                              : undefined,
                      }}
                    >
                      {row.status}
                    </p>
                  </td>
                  <td>{row.manufacturer}</td>
                  <td>{row.model}</td>
                  <td>{row.productType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Details = ({ row }: { row: EquipmentWarning }) => (
  <div className="stack">
    {row.productImage && <img className="full-width" src={row.productImage} alt="Product Image" />}
    <DetailLabel label="Date" value={row.date} />
    <DetailLabel label="In Production" value={row.inProduction} />
    <DetailLabel label="Description" value={row.description} />
    <DetailLabel label="Solution" value={row.solution} />
    <DetailLabel label="Link 1" value={<ExternalLink href={row.link1}>Link</ExternalLink>} />
    <DetailLabel label="Link 2" value={<ExternalLink href={row.link2}>Link</ExternalLink>} />
  </div>
);
