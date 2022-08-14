import type {APIGatewayEvent} from 'aws-lambda';
import AWS from 'aws-sdk';
import type {AWSError} from 'aws-sdk';

const db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10', region: process.env.AWS_REGION});
const {TABLE_NAME = ''} = process.env;

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event: APIGatewayEvent) => {
	let connectionData = null;

	try {
		connectionData = await db.scan({
			TableName: TABLE_NAME,
			ProjectionExpression: 'connectionId',
		}).promise();
	} catch (error) {
		return {statusCode: 500, body: error instanceof Error ? error.stack : 'Unknown Error'};
	}

	if (connectionData.Items === undefined) {
		return {statusCode: 500, body: 'Connection data not found'};
	}

	const apigwManagementApi = new AWS.ApiGatewayManagementApi({
		apiVersion: '2018-11-29',
		endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`,
	});

	const postData = JSON.parse(event.body ?? '{}').data;

	const postCalls = connectionData.Items.map(async ({connectionId}) => {
		try {
			await apigwManagementApi.postToConnection({
				ConnectionId: connectionId,
				Data: postData,
			}).promise();
		} catch (error) {
			if ((error as AWSError).statusCode === 410) {
				console.log(`Found stale connection, deleting ${connectionId}`);
				await db.delete({TableName: TABLE_NAME, Key: {connectionId}}).promise();
			} else {
				throw error;
			}
		}
	});

	try {
		await Promise.all(postCalls);
	} catch (error) {
		return {statusCode: 500, body: error instanceof Error ? error.stack : 'Unknown Error'};
	}

	return {statusCode: 200, body: 'Data sent.'};
};
