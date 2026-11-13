import { sendUserMessage } from '@server/functions/api/endpoints/contact/api';
import { SendUserMessagePostBody } from '@server/functions/api/endpoints/contact/schema';
import { baseApi } from 'store/rtk-query';
import { showSuccessNotification } from 'utils';

type SendUserMessageAPIResponse = Awaited<ReturnType<typeof sendUserMessage>>;

export const contactApi = baseApi
  .enhanceEndpoints({
    addTagTypes: ['contact'],
  })
  .injectEndpoints({
    endpoints: (builder) => ({
      sendUserMessage: builder.mutation<SendUserMessageAPIResponse, SendUserMessagePostBody>({
        query: (body) => ({
          url: `contact/sendUserMessage`,
          method: 'POST',
          body,
        }),
        async onQueryStarted(_, { dispatch, queryFulfilled }) {
          await queryFulfilled.then(() => {
            dispatch(showSuccessNotification('Message sent'));
          });
        },
      }),
    }),
  });
