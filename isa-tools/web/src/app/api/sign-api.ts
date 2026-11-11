import { baseApi } from 'store/rtk-query';

import { VerifyResult } from './types';

export const signApi = baseApi
  .enhanceEndpoints({
    addTagTypes: [],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      verify: builder.query<VerifyResult, string>({
        query: (token: string) => ({
          url: `sign/verify?token=${token}`,
        }),
      }),
    }),
  });
