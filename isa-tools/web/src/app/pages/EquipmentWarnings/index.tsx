import { ReactNode } from 'react';

import ZoomInIcon from '@mui/icons-material/ZoomIn';
import {
  Box,
  CircularProgress,
  IconButton,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import { listingsApi } from 'app/api/listings-api';
import { useDetailDialog } from 'app/components/Dialogs/useDetailDialog';
import { intersectAll, useDropdownFilter } from 'app/components/DropdownFilter/useDropdownFilter';

import { AlternatingTableRow } from '../CertifiedInstructors';

export function EquipmentWarnings() {
  const { data, isFetching } = listingsApi.useGetEquipmentWarningsQuery();
  const { InfoDialog, showInfoDialog } = useDetailDialog();

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

  const showDetails = (id?: string) => {
    const row = data?.find((row) => row.id === id);
    if (row) {
      showInfoDialog({
        title: `${row.manufacturer} - ${row.model}`,
        content: <Details row={row} />,
      });
    }
  };
  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography textAlign={'left'} variant="body2Bold">
          Warnings and recalls for slackline equipment
        </Typography>
        <Stack direction="row" spacing={1}>
          <productTypeFilter.DropdownFilter />
          <manufacturerFilter.DropdownFilter />
        </Stack>
      </Box>
      <InfoDialog />
      {isFetching ? (
        <CircularProgress />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: 'transparent',
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell />
                <TableCell>Status</TableCell>
                <TableCell>Manufacturer</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Product Type</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems?.map((row) => (
                <>
                  <AlternatingTableRow key={row.id}>
                    <TableCell>
                      <IconButton size="small" onClick={() => showDetails(row.id)}>
                        <ZoomInIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      {row.status === 'Warning' ? (
                        <Typography color={'orange'}>Warning</Typography>
                      ) : row.status === 'Recall' ? (
                        <Typography color={'red'}>Recall</Typography>
                      ) : (
                        <Typography>{row.status}</Typography>
                      )}
                    </TableCell>
                    <TableCell>{row.manufacturer}</TableCell>
                    <TableCell>{row.model}</TableCell>
                    <TableCell>{row.productType}</TableCell>
                  </AlternatingTableRow>
                </>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}

const Details = ({ row }: { row: any }) => (
  <Stack spacing={2} sx={{}}>
    {row.productImage && (
      <img src={row.productImage} alt="Product Image" style={{ width: '100%' }} />
    )}
    <DetailLabel label="Date" value={row.date} />
    <DetailLabel label="In Production" value={row.inProduction} />
    <DetailLabel label="Description" value={row.description} />
    <DetailLabel label="Solution" value={row.solution} />
    <DetailLabel
      label="Link 1"
      value={
        <Link href={row.link1} target="_blank" rel="noopener noreferrer">
          Link
        </Link>
      }
    />
    <DetailLabel
      label="Link 2"
      value={
        <Link href={row.link2} target="_blank" rel="noopener noreferrer">
          Link
        </Link>
      }
    />
  </Stack>
);

const DetailLabel = ({ label, value }: { label: string; value: string | ReactNode }) => (
  <Typography variant="body2">
    <b>{label}</b>: {value}
  </Typography>
);
