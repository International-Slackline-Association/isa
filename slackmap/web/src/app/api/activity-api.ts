import {
  getGlobalActivityChangelogs,
  getGlobalContributors,
} from '@server/functions/api/endpoints/activity/api';
import { baseApi } from 'store/rtk-query';

type GetActivityChangelogsAPIResponse = Awaited<ReturnType<typeof getGlobalActivityChangelogs>>;
type getGlobalContributorsAPIResponse = Awaited<ReturnType<typeof getGlobalContributors>>;

export const activityApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ['activityContributors', 'activityChangelogs'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      getGlobalContributors: builder.query<getGlobalContributorsAPIResponse, void>({
        query: () => ({
          url: `activity/contributors`,
        }),
        providesTags: ['activityContributors'],
      }),
      getActivityChangelogs: builder.query<
        GetActivityChangelogsAPIResponse,
        { cursor?: string; type?: string; createdOnly?: boolean }
      >({
        query: (params) => ({
          url: `activity/changelogs`,
          params: {
            cursor: params.cursor,
            type: params.type,
            createdOnly: params.createdOnly ? 'true' : undefined,
          },
        }),
        providesTags: ['activityChangelogs'],
        serializeQueryArgs: ({ endpointName, queryArgs }) => {
          return `${endpointName}:${queryArgs.type ?? 'all'}:${Boolean(queryArgs.createdOnly)}`;
        },
        merge: (currentCache, newResponse) => {
          const items = currentCache.items.concat(newResponse.items);
          const uniqueItems = items.reduce(
            (acc, item) => {
              if (!acc.find((i) => i.date === item.date)) {
                acc.push(item);
              }
              return acc;
            },
            [] as typeof items,
          );

          currentCache.items = uniqueItems;
          currentCache.pagination = newResponse.pagination;
        },
        forceRefetch({ currentArg, previousArg }) {
          return (
            currentArg?.cursor !== previousArg?.cursor ||
            currentArg?.type !== previousArg?.type ||
            currentArg?.createdOnly !== previousArg?.createdOnly
          );
        },
      }),
    }),
  });
