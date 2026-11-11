import {
  Box,
  CircularProgress,
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
import { useDropdownFilter } from 'app/components/DropdownFilter/useDropdownFilter';

import { AlternatingTableRow } from '../CertifiedInstructors';

export function CertifiedRiggers() {
  const { data, isFetching } = listingsApi.useGetRiggerListQuery();

  const { filteredItems, DropdownFilter } = useDropdownFilter({
    label: 'Country',
    list: data?.map((row) => row.country),
    filterer: [data, 'country'],
  });

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography textAlign={'left'} variant="body2Bold">
          List of Certified Riggers
        </Typography>
        <DropdownFilter />
      </Box>
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
                <TableCell>Name</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Expiration Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems?.map((row) => (
                <AlternatingTableRow key={row.certId}>
                  <TableCell>
                    <a href={`mailto:${row.email}`}>{row.name?.substring(0, 50)}</a>
                  </TableCell>
                  <TableCell>{row.country?.substring(0, 20)}</TableCell>
                  <TableCell>{row.expirationDate}</TableCell>
                </AlternatingTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
