import { getCommunityCountryDetails } from '@server/functions/api/endpoints/communities/api';
import { getGroupDetails } from '@server/functions/api/endpoints/group/api';
import {
  CreateGroupPostBody,
  UpdateGroupPostBody,
} from '@server/functions/api/endpoints/group/schema';
import { baseApi } from 'store/rtk-query';
import { showInfoNotification } from 'utils';

type GetCommunityCountryDetailsAPIResponse = Awaited<ReturnType<typeof getCommunityCountryDetails>>;
export type GetGroupDetailsAPIResponse = Awaited<ReturnType<typeof getGroupDetails>>;

export const communityApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ['communityCountryDetails', 'groupDetails', 'featureEditors'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getCommunityCountryDetails: builder.query<GetCommunityCountryDetailsAPIResponse, string>({
        query: (code) => ({ url: `communities/country/${code}` }),
        providesTags: ['communityCountryDetails'],
      }),
      getGroupDetails: builder.query<GetGroupDetailsAPIResponse, string>({
        query: (id) => ({ url: `group/${id}/details` }),
        providesTags: ['groupDetails', 'featureEditors'],
      }),
      createGroup: builder.mutation<GetGroupDetailsAPIResponse, CreateGroupPostBody>({
        query: (body) => ({ url: `group`, method: 'POST', body }),
        invalidatesTags: ['communityCountryDetails'],
        async onQueryStarted(_, { dispatch, queryFulfilled }) {
          await queryFulfilled.then(() => {
            dispatch(showInfoNotification('Refresh the page after few seconds', 5000));
          });
        },
      }),
      updateGroup: builder.mutation<
        GetGroupDetailsAPIResponse,
        { id: string; payload: UpdateGroupPostBody }
      >({
        query: ({ id, payload }) => ({ url: `group/${id}`, method: 'PUT', body: payload }),
        invalidatesTags: ['groupDetails', 'communityCountryDetails'],
        async onQueryStarted(_, { dispatch, queryFulfilled }) {
          await queryFulfilled.then(() => {
            dispatch(showInfoNotification('Refresh the page after few seconds', 5000));
          });
        },
      }),
    }),
  });
