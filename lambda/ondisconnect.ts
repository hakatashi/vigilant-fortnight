// $disconnected is the best-effort event and not guaranteed to be delivered.

import type {APIGatewayEvent} from 'aws-lambda';
import AWS from 'aws-sdk';

const db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10', region: process.env.AWS_REGION});
const {TABLE_NAME = ''} = process.env;

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event: APIGatewayEvent) => {
	const deleteParams = {
		TableName: TABLE_NAME,
		Key: {
			connectionId: event.requestContext.connectionId,
		},
	};

	try {
		await db.delete(deleteParams).promise();
	} catch (err) {
		return {statusCode: 500, body: `Failed to disconnect: ${JSON.stringify(err)}`};
	}

	return {statusCode: 200, body: 'Disconnected.'};
};
