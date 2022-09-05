import {createClient} from 'urql';

// eslint-disable-next-line import/prefer-default-export
export const client = createClient({
	url: 'https://6myfzo5ewbfz7llufkbtmzs4u4.appsync-api.ap-northeast-1.amazonaws.com/graphql',
	fetchOptions: {
		headers: {
			'X-API-Key': 'da2-3s227pbhkrcybmpk4bt5mfho7a',
		},
	},
});
