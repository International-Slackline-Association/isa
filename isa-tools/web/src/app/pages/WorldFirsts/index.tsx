import {
  CircularProgress,
  Link,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

import { listingsApi } from 'app/api/listings-api';
import { intersectAll, useDropdownFilter } from 'app/components/DropdownFilter/useDropdownFilter';

import { AlternatingTableRow } from '../CertifiedInstructors';

export function WorldFirsts() {
  const { data, isFetching } = listingsApi.useGetWorldFirstsQuery();

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
    <Stack spacing={2}>
      <Stack direction="row" spacing={1} alignSelf={'flex-end'}>
        <categoryFilter.DropdownFilter />
        <countryFilter.DropdownFilter />
        <typeOfLineFilter.DropdownFilter />
      </Stack>
      {isFetching ? (
        <CircularProgress />
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            backgroundColor: 'transparent',
          }}
        >
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Country</TableCell>
                <TableCell>Links</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems?.map((row) => (
                <AlternatingTableRow key={row.certId}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell width={'30%'}>{row.description}</TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.country}</TableCell>
                  <TableCell>
                    {row.link1 && (
                      <Link href={row.link1} target="_blank" rel="noopener noreferrer">
                        Link 1
                      </Link>
                    )}
                    {row.link1 && row.link2 && ', '}
                    {row.link2 && (
                      <Link href={row.link2} target="_blank" rel="noopener noreferrer">
                        Link 2
                      </Link>
                    )}
                  </TableCell>
                </AlternatingTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Stack>
  );
}
