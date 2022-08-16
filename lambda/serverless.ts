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
					{
						'Fn::GetAtt': [
							'ButtonsTable',
							'Arn',
						],
					},
				],
			},
		],
		environment: {
			CONNECTIONS_TABLE: {
				Ref: 'ConnectionsTable',
			},
			BUTTONS_TABLE: {
				Ref: 'ButtonsTable',
			},
		},
		profile: 'serverless',
		websocketsApiName: '${self:service}',
		websocketsApiRouteSelectionExpression: '$request.body.message',
	},
	functions: {
		connect: {
			handler: 'onconnect.handler',
			events: [
				{
					websocket: {
						route: '$connect',
					},
				},
			],
		},
		disconnect: {
			handler: 'ondisconnect.handler',
			events: [
				{
					websocket: {
						route: '$disconnect',
					},
				},
			],
		},
		sendmessage: {
			handler: 'sendmessage.handler',
			events: [
				{
					websocket: {
						route: 'sendmessage',
					},
				},
			],
		},
		bidbutton: {
			handler: 'bidbutton.handler',
			events: [
				{
					websocket: {
						route: 'bidbutton',
					},
				},
			],
		},
		createbutton: {
			handler: 'createbutton.handler',
			events: [
				{
					http: {
						path: 'button',
						method: 'put',
						cors: true,
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
					TableName: 'introquiz_connections_${self:provider.stage}',
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
						ReadCapacityUnits: 2,
						WriteCapacityUnits: 2,
					},
					SSESpecification: {
						SSEEnabled: true,
					},
				},
			},
			ButtonsTable: {
				Type: 'AWS::DynamoDB::Table',
				Properties: {
					TableName: 'introquiz_buttons_${self:provider.stage}',
					AttributeDefinitions: [
						{
							AttributeName: 'buttonId',
							AttributeType: 'S',
						},
					],
					KeySchema: [
						{
							AttributeName: 'buttonId',
							KeyType: 'HASH',
						},
					],
					ProvisionedThroughput: {
						ReadCapacityUnits: 2,
						WriteCapacityUnits: 2,
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
