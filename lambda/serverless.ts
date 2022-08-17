/* eslint-disable no-template-curly-in-string */

import type {AWS} from '@serverless/typescript';

// eslint-disable-next-line import/prefer-default-export
const service: AWS = {
	service: 'SimpleChatWebSocket',
	plugins: [
		'serverless-plugin-typescript',
		'serverless-appsync-plugin',
	],
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
							AttributeName: 'id',
							AttributeType: 'S',
						},
					],
					KeySchema: [
						{
							AttributeName: 'id',
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
			AppSyncDynamoDBServiceRole: {
				Type: 'AWS::IAM::Role',
				Properties: {
					RoleName: 'dynamodb_service_${self:provider.stage}',
					AssumeRolePolicyDocument: {
						Version: '2012-10-17',
						Statement: [
							{
								Effect: 'Allow',
								Principal: {
									Service: [
										'appsync.amazonaws.com',
									],
								},
								Action: [
									'sts:AssumeRole',
								],
							},
						],
					},
					Policies: [
						{
							PolicyName: 'dynamo-policy',
							PolicyDocument: {
								Version: '2012-10-17',
								Statement: [
									{
										Effect: 'Allow',
										Action: [
											'dynamodb:Query',
											'dynamodb:BatchWriteItem',
											'dynamodb:GetItem',
											'dynamodb:DeleteItem',
											'dynamodb:PutItem',
											'dynamodb:Scan',
											'dynamodb:UpdateItem',
										],
										Resource: [
											'*',
										],
									},
								],
							},
						},
					],
				},
			},
		},
	},
	custom: {
		dynamodb: {
			stages: [
				'dev',
				'prod',
			],
			start: {
				port: 8000,
				inMemory: true,
			},
		},
		appSync: {
			name: '${opt:stage, self:provider.stage}_introquiz_backend',
			authenticationType: 'API_KEY',
			schema: 'schema.graphql',
			apiKeys: [
				{
					name: "test-api-key",
					description: "Test API Key",
					expiresAfter: "30d",
				},
			],
			defaultMappingTemplates: {
				request: 'start.vtl',
				response: 'end.vtl',
			}, 
			dataSources: [
				{
					type: 'AMAZON_DYNAMODB',
					name: 'connections_table',
					description: 'The list of connections',
					config: {
						tableName: {
							Ref: 'ConnectionsTable',
						},
						serviceRoleArn: {
							'Fn::GetAtt': [
								'AppSyncDynamoDBServiceRole',
								'Arn',
							],
						},
						region: 'ap-northeast-1',
					},
				},
				{
					type: 'AMAZON_DYNAMODB',
					name: 'buttons_table',
					description: 'The list of buttons',
					config: {
						tableName: {
							Ref: 'ButtonsTable',
						},
						serviceRoleArn: {
							'Fn::GetAtt': [
								'AppSyncDynamoDBServiceRole',
								'Arn',
							],
						},
						region: 'ap-northeast-1',
					},
				},
			],
			mappingTemplatesLocation: 'mapping-templates',
			mappingTemplates: [
				{
					type: 'Query',
					field: 'button',
					kind: 'PIPELINE',
					functions: [
						'getButton',
					],
				},
				{
					dataSource: 'buttons_table',
					type: 'Mutation',
					field: 'createButton',
					request: 'Mutation.createButton.request.vtl',
				},
			],
			functionConfigurations: [
				{
					dataSource: 'buttons_table',
					name: 'getButton',
					request: 'getButton.request.vtl',
					response: 'getButton.response.vtl',
				},
			],
		},
	},

};

module.exports = service;
