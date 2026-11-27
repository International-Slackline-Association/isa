import { baseApi } from 'store/rtk-query';

type Agreement = { version: string; accepted: boolean };

export type MyActivation = {
  featureType: 'line' | 'spot';
  featureId: string;
  kind: 'once' | 'dates';
  from: number;
  until: number;
  remind: boolean;
  name: string | null;
};

export const meApi = baseApi.enhanceEndpoints({ addTagTypes: ['contributorAgreement', 'myActivations'] }).injectEndpoints({
  endpoints: (builder) => ({
    getContributorAgreement: builder.query<Agreement, void>({
      query: () => ({ url: 'me/agreement' }),
      providesTags: ['contributorAgreement'],
    }),
    acceptContributorAgreement: builder.mutation<Agreement, string>({
      query: (version) => ({ url: 'me/agreement', method: 'POST', body: { version } }),
      invalidatesTags: ['contributorAgreement'],
    }),
    getMyActivations: builder.query<{ activations: MyActivation[] }, void>({
      query: () => ({ url: 'me/activations' }),
      providesTags: ['myActivations'],
    }),
  }),
});
