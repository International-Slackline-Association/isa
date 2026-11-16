import { baseApi } from 'store/rtk-query';

type Agreement = { version: string; accepted: boolean };

export const meApi = baseApi.enhanceEndpoints({ addTagTypes: ['contributorAgreement'] }).injectEndpoints({
  endpoints: (builder) => ({
    getContributorAgreement: builder.query<Agreement, void>({
      query: () => ({ url: 'me/agreement' }),
      providesTags: ['contributorAgreement'],
    }),
    acceptContributorAgreement: builder.mutation<Agreement, string>({
      query: (version) => ({ url: 'me/agreement', method: 'POST', body: { version } }),
      invalidatesTags: ['contributorAgreement'],
    }),
  }),
});
