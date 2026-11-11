import { verifySignedDocument } from '@server/functions/api/endpoints/sign-api';
import { baseApi } from 'store/rtk-query';
import { AsyncReturnType } from 'type-fest';

export const signApi = baseApi
  .enhanceEndpoints({
    addTagTypes: [],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      verify: builder.query<AsyncReturnType<typeof verifySignedDocument>, string>({
        query: (token: string) => ({
          url: `sign/verify?token=${token}`,
        }),
      }),
    }),
  });
