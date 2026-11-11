import { baseApi } from 'store/rtk-query';

import {
  CertifiedGear,
  EquipmentWarning,
  Instructor,
  Rigger,
  SairReport,
  WorldFirst,
  WorldRecord,
} from './types';

const list = <T>(url: string) => ({
  query: () => ({ url }),
  transformResponse: (response: { items: T[] }) => response.items,
});

export const listingsApi = baseApi
  .enhanceEndpoints({
    addTagTypes: [],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getInstructorsList: builder.query<Instructor[], void>(list<Instructor>('sheets/list/instructors')),
      getRiggerList: builder.query<Rigger[], void>(list<Rigger>('sheets/list/riggers')),
      getCertifiedGears: builder.query<CertifiedGear[], void>(list<CertifiedGear>('sheets/list/approved-gears')),
      getEquipmentWarnings: builder.query<EquipmentWarning[], void>(list<EquipmentWarning>('sheets/list/equipment-warnings')),
      getSairReports: builder.query<SairReport[], void>(list<SairReport>('sheets/list/sair-reports')),
      getWorldRecords: builder.query<WorldRecord[], void>(list<WorldRecord>('sheets/list/world-records')),
      getWorldFirsts: builder.query<WorldFirst[], void>(list<WorldFirst>('sheets/list/world-firsts')),
    }),
  });
