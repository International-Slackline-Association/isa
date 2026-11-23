import { getGuideDetails } from '@server/functions/api/endpoints/guide/api';
import {
  CreateGuidePostBody,
  UpdateGuidePostBody,
} from '@server/functions/api/endpoints/guide/schema';
import { baseApi } from 'store/rtk-query';
import { showSuccessNotification } from 'utils';

import { reloadMapDataAfterWrite } from './geojson-data';

export type GetGuideDetailsAPIResponse = Awaited<ReturnType<typeof getGuideDetails>>;

export const guideApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ['guideDetails'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getGuideDetails: builder.query<GetGuideDetailsAPIResponse, string>({
        query: (id) => ({ url: `guide/${id}/details` }),
        providesTags: ['guideDetails'],
      }),
      createGuide: builder.mutation<GetGuideDetailsAPIResponse, CreateGuidePostBody>({
        query: (body) => ({
          url: `guide`,
          method: 'POST',
          body: body,
        }),
        async onQueryStarted(_, { dispatch, queryFulfilled }) {
          reloadMapDataAfterWrite('features', queryFulfilled);
          await queryFulfilled.then(() => {
            dispatch(showSuccessNotification('Changes Saved'));
          });
        },
      }),
      updateGuide: builder.mutation<
        GetGuideDetailsAPIResponse,
        { id: string; payload: UpdateGuidePostBody }
      >({
        query: ({ id, payload }) => ({
          url: `guide/${id}`,
          method: 'PUT',
          body: payload,
        }),
        invalidatesTags: ['guideDetails'],
        async onQueryStarted(_, { dispatch, queryFulfilled }) {
          reloadMapDataAfterWrite('features', queryFulfilled);
          await queryFulfilled.then(() => {
            dispatch(showSuccessNotification('Changes Saved'));
          });
        },
      }),
    }),
  });
