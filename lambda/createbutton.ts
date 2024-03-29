import type {APIGatewayEvent} from 'aws-lambda';
import uniqid from 'uniqid';
import {createButton} from './lib/db';

interface Body {
	connectionId: string,
}

const validate = (data: any): data is Body => (
	data !== null &&
		data !== undefined &&
		typeof data.connectionId === 'string'
);

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event: APIGatewayEvent) => {
	const postData = JSON.parse(event.body ?? '{}');

	if (!validate(postData)) {
		return {statusCode: 500, body: 'Validation failed'};
	}

	const buttonId = uniqid();
	await createButton(buttonId, Date.now(), postData.connectionId);

	return {
		statusCode: 201,
		body: JSON.stringify({
			id: buttonId,
		}),
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
	};
};
