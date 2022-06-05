/* eslint-disable no-template-curly-in-string */

import type {AWS} from '@serverless/typescript';

// eslint-disable-next-line import/prefer-default-export
const service: AWS = {
	service: 'SimpleChatWebSocket',
	plugins: ['serverless-plugin-typescript'],
	provider: {
		name: 'aws',
		stage: '${opt:stage, \'dev\'}',
		region: 'ap-northeast-1',
		runtime: 'nodejs16.x',
		iamRoleStatements: [
			{
				Effect: 'Allow',
				Action: [
					'dynamodb:*',
				],
				Resource: [
					{
						'Fn::GetAtt': [
							'ConnectionsTable',
							'Arn',
						],
					},
				],
			},
		],
		environment: {
			TABLE_NAME: {
				Ref: 'ConnectionsTable',
			},
		},
		profile: 'serverless',
		websocketsApiName: '${self:service}',
		websocketsApiRouteSelectionExpression: '$request.body.message',
	},
	functions: {
		connect: {
			handler: 'onconnect/app.handler',
			events: [
				{
					websocket: {
						route: '$connect',
					},
				},
			],
		},
		disconnect: {
			handler: 'ondisconnect/app.handler',
			events: [
				{
					websocket: {
						route: '$disconnect',
					},
				},
			],
		},
		sendmessage: {
			handler: 'sendmessage/app.handler',
			events: [
				{
					websocket: {
						route: 'sendmessage',
					},
				},
			],
		},
	},
	resources: {
		Resources: {
			ConnectionsTable: {
				Type: 'AWS::DynamoDB::Table',
				Properties: {
					TableName: 'simplechat_connections',
					AttributeDefinitions: [
						{
							AttributeName: 'connectionId',
							AttributeType: 'S',
						},
					],
					KeySchema: [
						{
							AttributeName: 'connectionId',
							KeyType: 'HASH',
						},
					],
					ProvisionedThroughput: {
						ReadCapacityUnits: 5,
						WriteCapacityUnits: 5,
					},
					SSESpecification: {
						SSEEnabled: true,
					},
				},
			},
		},
	},
};

module.exports = service;
