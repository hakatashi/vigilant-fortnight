
import AWS from 'aws-sdk';
import type {AWSError} from 'aws-sdk';

const {CONNECTIONS_TABLE = '', BUTTONS_TABLE = ''} = process.env;

export const db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10', region: process.env.AWS_REGION});

export const getConnections = async () => {
	const connectionsData = await db.scan({
		TableName: CONNECTIONS_TABLE,
		ProjectionExpression: 'connectionId',
	}).promise();
	return connectionsData.Items ?? [];
}

export const deleteConnection = (connectionId: string) => (
	db.delete({
		TableName: CONNECTIONS_TABLE,
		Key: {connectionId},
	}).promise()
)

export const getButton = async (buttonId: string) => {
	const button = await db.get({
		TableName: BUTTONS_TABLE,
		Key: {
			buttonId,
		},
	}).promise();
	return button.Item;
}

export const addBidToButton = async (buttonId: string, user: string, timestamp: number) => (
	db.update({
		TableName: BUTTONS_TABLE,
		Key: {
			buttonId,
		},
		UpdateExpression: 'SET bids = list_append(bids, :bid)',
		ExpressionAttributeValues: {
			':bid': [{user, timestamp}],
		},
		ReturnValues: "UPDATED_NEW",
	})
);