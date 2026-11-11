import { useList } from '../api';
import { DetailLabel, ExternalLink, useDetailDialog } from '../components/DetailDialog';
import { intersectAll, useDropdownFilter } from '../components/Filter';
import { Icon } from '../components/Icons';
import { Spinner } from '../components/Spinner';
import { CertifiedGear } from '../types';

export function CertifiedGears() {
  const { data, isFetching } = useList<CertifiedGear>('sheets/list/approved-gears');
  const { dialog, showDetails } = useDetailDialog();

  const productTypeFilter = useDropdownFilter({
    label: 'Product Type',
    list: data?.map((row) => row.productType),
    filterer: [data, 'productType'],
  });

  const brandFilter = useDropdownFilter({
    label: 'Brand',
    list: data?.map((row) => row.brand),
    filterer: [data, 'brand'],
  });

  const filteredItems = intersectAll(productTypeFilter.filteredItems, brandFilter.filteredItems);

  return (
    <div className="stack">
      <div className="page-head">
        <p className="title">List of Certified Gear</p>
        <div className="filters">
          {productTypeFilter.dropdown}
          {brandFilter.dropdown}
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
                <th>Brand</th>
                <th>Model</th>
                <th>Standard</th>
                <th>Product Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((row) => (
                <tr key={row.certId}>
                  <td>
                    <button
                      className="icon-button"
                      aria-label="Details"
                      onClick={() =>
                        showDetails({
                          title: `${row.brand} - ${row.modelName}`,
                          content: <GearDetails row={row} />,
                        })
                      }
                    >
                      <Icon name="zoomIn" />
                    </button>
                  </td>
                  <td>
                    <a href={`mailto:${row.email}`}>{row.brand}</a>
                  </td>
                  <td>{row.modelName}</td>
                  <td>{row.standard}</td>
                  <td>
                    <ExternalLink href={row.productLink}>Product Link</ExternalLink>
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

const GearDetails = ({ row }: { row: CertifiedGear }) => (
  <div className="stack centered">
    <div className="pictures">
      <img src={row.picture1} alt="Product Image" />
      <img src={row.picture2} alt="Product Image" />
    </div>
    <DetailLabel label="Product Type" value={row.productType} />
    <DetailLabel label="Model Version" value={row.modelVersion} />
    <DetailLabel label="Release Year" value={row.releaseYear} />
    <DetailLabel label="Manual Link" value={<ExternalLink href={row.manualLink}>Link</ExternalLink>} />
    <DetailLabel label="Testing Laboratory" value={row.testingLaboratory} />
    <DetailLabel label="Test Date" value={row.testDate} />
    <DetailLabel label="Standard Version" value={row.standardVersion} />
  </div>
);
