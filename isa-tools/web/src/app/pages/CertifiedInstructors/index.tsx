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
  colors,
  styled,
} from '@mui/material';

import { listingsApi } from 'app/api/listings-api';
import { useDropdownFilter } from 'app/components/DropdownFilter/useDropdownFilter';

export const AlternatingTableRow = styled(TableRow)`
  &:nth-of-type(even) {
    background-color: ${() => colors.grey[200]};
  }
`;

export function CertifiedInstructors() {
  const { data, isFetching } = listingsApi.useGetInstructorsListQuery();

  const { filteredItems, DropdownFilter } = useDropdownFilter({
    label: 'Country',
    list: data?.map((row) => row.country),
    filterer: [data, 'country'],
  });

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography textAlign={'left'} variant="body2Bold">
          List of Certified Instructors
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
                <TableCell>Level</TableCell>
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
                  <TableCell>{row.level}</TableCell>
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
