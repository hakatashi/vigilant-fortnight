import type {APIGatewayEvent} from 'aws-lambda';
import AWS from 'aws-sdk';

const db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10', region: process.env.AWS_REGION});
const {CONNECTIONS_TABLE = ''} = process.env;

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event: APIGatewayEvent) => {
	const putParams = {
		TableName: CONNECTIONS_TABLE,
		Item: {
			connectionId: event.requestContext.connectionId,
		},
	};

	try {
		await db.put(putParams).promise();
	} catch (err) {
		return {statusCode: 500, body: `Failed to connect: ${JSON.stringify(err)}`};
	}

	return {statusCode: 200, body: 'Connected.'};
};
