import { createClient } from 'urql';

export const client = createClient({
  url: 'https://6myfzo5ewbfz7llufkbtmzs4u4.appsync-api.ap-northeast-1.amazonaws.com/graphql',
  fetchOptions: {
    headers: {
      authorization: 'Bearer da2-3s227pbhkrcybmpk4bt5mfho7a',
    },
  },
});