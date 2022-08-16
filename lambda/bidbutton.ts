import type {APIGatewayEvent} from 'aws-lambda';
import AWS from 'aws-sdk';
import type {AWSError} from 'aws-sdk';
import {addBidToButton, deleteConnection, getButton, getConnections} from './lib/db'

interface Body {
	buttonId: string,
	timestamp: number,
}

const validate = (data: any): data is Body => ( 
	data !== null &&
		data !== undefined &&
		typeof data.buttonId === 'string' && 
		typeof data.timestamp === 'number' &&
		Number.isInteger(data.timestamp)
);

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event: APIGatewayEvent) => {
	const postData = JSON.parse(event.body ?? '{}').data;

	if (!validate(postData)) {
		return {statusCode: 500, body: 'Validation failed'};
	}

	const button = await getButton(postData.buttonId);

	if (!button) {
		return {statusCode: 500, body: 'Button not found'};
	}

	addBidToButton(postData.buttonId, event.requestContext.connectionId, postData.timestamp);

	const connections = await getConnections();

	const apigwManagementApi = new AWS.ApiGatewayManagementApi({
		apiVersion: '2018-11-29',
		endpoint: `${event.requestContext.domainName}/${event.requestContext.stage}`,
	});

	const onButtonLockTimedOut = async () => {
		await apigwManagementApi.postToConnection({
			ConnectionId: event.requestContext.connectionId,
			Data: {
				type: 'bidSuccess',
				buttonId: postData.buttonId,
				timestamp: postData.timestamp,
			},
		}).promise();
	};

	setTimeout(onButtonLockTimedOut, 5000);

	const postCalls = connections.map(async ({connectionId}) => {
		try {
			await apigwManagementApi.postToConnection({
				ConnectionId: connectionId,
				Data: {
					type: 'bidNotification',
					buttonId: postData.buttonId,
					timestamp: postData.timestamp,
				},
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
