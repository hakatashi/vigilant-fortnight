import type {APIGatewayEvent} from 'aws-lambda';
import AWS from 'aws-sdk';
import type {AWSError} from 'aws-sdk';
import {getConnections, deleteConnection} from './lib/db'

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event: APIGatewayEvent) => {
	const connections = await getConnections();

	if (connections.length === 0) {
		return {statusCode: 500, body: 'Connections data not found'};
	}

	const apigwManagementApi = new AWS.ApiGatewayManagementApi({
		apiVersion: '2018-11-29',
		endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`,
	});

	const postData = JSON.parse(event.body ?? '{}').data;

	const postCalls = connections.map(async ({connectionId}) => {
		try {
			await apigwManagementApi.postToConnection({
				ConnectionId: connectionId,
				Data: postData,
			}).promise();
		} catch (error) {
			if ((error as AWSError).statusCode === 410) {
				console.log(`Found stale connection, deleting ${connectionId}`);
				await deleteConnection(connectionId);
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
