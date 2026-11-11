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

export function CertifiedGears() {
  const { data, isFetching } = listingsApi.useGetCertifiedGearsQuery();
  const { InfoDialog, showInfoDialog } = useDetailDialog();

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

  const showDetails = (certId: string | undefined) => {
    const row = data?.find((row) => row.certId === certId);
    if (row) {
      showInfoDialog({
        title: `${row.brand} - ${row.modelName}`,
        content: <GearDetails row={row} />,
      });
    }
  };
  const filteredItems = intersectAll(productTypeFilter.filteredItems, brandFilter.filteredItems);
  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography textAlign={'left'} variant="body2Bold">
          List of Certified Gear
        </Typography>
        <Stack direction="row" spacing={1}>
          <productTypeFilter.DropdownFilter />
          <brandFilter.DropdownFilter />
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
                <TableCell>Brand</TableCell>
                <TableCell>Model</TableCell>
                <TableCell>Standard</TableCell>
                <TableCell>Product Link</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems?.map((row) => (
                <>
                  <AlternatingTableRow key={row.certId}>
                    <TableCell>
                      <IconButton size="small" onClick={() => showDetails(row.certId)}>
                        <ZoomInIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <a href={`mailto:${row.email}`}>{row.brand}</a>
                    </TableCell>
                    <TableCell>{row.modelName}</TableCell>
                    <TableCell>{row.standard}</TableCell>
                    <TableCell>
                      <Link href={row.productLink} target="_blank" rel="noopener noreferrer">
                        Product Link
                      </Link>
                    </TableCell>
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

const GearDetails = ({ row }: { row: any }) => (
  <Stack spacing={2} sx={{ alignItems: 'center' }}>
    <Stack spacing={1} direction="row" sx={{ width: '100%' }}>
      <img src={row.picture1} alt={'Product Image'} style={{ width: '100%' }} />
      <img src={row.picture2} alt={'Product Image'} style={{ width: '100%' }} />
    </Stack>
    <DetailLabel label="Product Type" value={row.productType} />
    <DetailLabel label="Model Version" value={row.modelVersion} />
    <DetailLabel label="Release Year" value={row.releaseYear} />
    <DetailLabel
      label="Manual Link"
      value={
        <Link href={row.manualLink} target="_blank" rel="noopener noreferrer">
          Link
        </Link>
      }
    />
    <DetailLabel label="Testing Laboratory" value={row.testingLaboratory} />
    <DetailLabel label="Test Date" value={row.testDate} />
    <DetailLabel label="Standard Version" value={row.standardVersion} />
  </Stack>
);

const DetailLabel = ({ label, value }: { label: string; value: string | ReactNode }) => (
  <Typography variant="body2">
    <b>{label}</b>: {value}
  </Typography>
);
