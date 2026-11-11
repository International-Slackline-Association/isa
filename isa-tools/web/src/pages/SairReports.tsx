import { useList } from '../api';
import { DetailLabel, useDetailDialog } from '../components/DetailDialog';
import { intersectAll, useDropdownFilter } from '../components/Filter';
import { Icon } from '../components/Icons';
import { Spinner } from '../components/Spinner';
import { SairReport } from '../types';

// url format: https://drive.google.com/file/d/XXXX/view?usp=drive_link
function convertGoogleDriveImageToUrl(url?: string) {
  const id = url?.split('/')[5];
  return `https://lh3.googleusercontent.com/d/${id}`;
}

export function SairReports() {
  const { data, isFetching } = useList<SairReport>('sheets/list/sair-reports');
  const { dialog, showDetails } = useDetailDialog();

  const incidentTypeFilter = useDropdownFilter({
    label: 'Incident Type',
    list: data?.map((row) => row.incidentType?.split(',')).flat(),
    filterer: [data, 'incidentType'],
  });

  const slacklineTypeFilter = useDropdownFilter({
    label: 'Slackline Type',
    list: data?.map((row) => row.slacklineType),
    filterer: [data, 'slacklineType'],
  });

  const moreFilter = useDropdownFilter({
    label: 'Extra Filters',
    list: data?.map((row) => row.filters?.split(',')).flat(),
    filterer: [data, 'filters'],
  });

  const filteredItems = intersectAll(
    incidentTypeFilter.filteredItems,
    slacklineTypeFilter.filteredItems,
    moreFilter.filteredItems,
  );

  return (
    <div className="stack">
      <div className="filters end">
        {incidentTypeFilter.dropdown}
        {slacklineTypeFilter.dropdown}
        {moreFilter.dropdown}
      </div>
      {dialog}
      {isFetching ? (
        <Spinner />
      ) : (
        <div className="table-container">
          <table className="small">
            <thead>
              <tr>
                <th />
                <th>Date</th>
                <th>Type of Injury</th>
                <th>Location of Injury</th>
                <th>Type Of Incident</th>
                <th>Type of Slackline</th>
                <th>Country</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems?.map((row) => (
                <tr key={row.timestamp}>
                  <td>
                    <div className="stack centered tight">
                      <button
                        className="icon-button"
                        aria-label="Details"
                        onClick={() =>
                          showDetails({
                            title: 'Incident Report Details',
                            content: <Details row={row} />,
                          })
                        }
                      >
                        <Icon name="zoomIn" />
                      </button>
                      {row.images.length > 0 && (
                        <img src="/images/images-placeholder.svg" style={{ width: '16px' }} />
                      )}
                    </div>
                  </td>
                  <td>{row.incidentDate}</td>
                  <td style={{ width: '20%' }}>{row.injuryType}</td>
                  <td style={{ width: '20%' }}>{row.injuryLocation}</td>
                  <td style={{ width: '20%' }}>{row.incidentType}</td>
                  <td>{row.slacklineType}</td>
                  <td>{row.countryName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const Details = ({ row }: { row: SairReport }) => (
  <div className="stack preline">
    <img className="full-width" src={convertGoogleDriveImageToUrl(row.coverImage)} alt="" />
    <DetailLabel label="Narrative" value={row.narrative} />
    <DetailLabel label="Analysis" value={row.analysis} />
    <DetailLabel label="Type of Incident" value={row.incidentType} />
    <DetailLabel label="Type of Slackline" value={row.slacklineType} />
    <DetailLabel label="Type of Injury" value={row.injuryType} />
    <DetailLabel label="Country" value={row.countryName} />
    <DetailLabel label="Severity" value={row.severity} />
    <DetailLabel label="Injury Location" value={row.injuryLocation} />
    <DetailLabel label="Filters" value={row.filters} />
    <p className="title">Images</p>
    <div className="images">
      {row.images.map((image, index) => (
        <img key={index} className="full-width" src={convertGoogleDriveImageToUrl(image)} alt="" />
      ))}
    </div>
  </div>
);
