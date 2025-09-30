import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod, } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { vaccineApi } from './api/resource';
const backend = defineBackend({
    auth,
    data,
    vaccineApi,
});
// Grant Bedrock permissions to the Lambda function
backend.vaccineApi.resources.lambda.addToRolePolicy(new PolicyStatement({
    actions: ['bedrock:InvokeModel'],
    resources: [
        // Grant access to all Claude 3.5 Sonnet models in us-east-1
        'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-*',
        // Specific model we're using
        'arn:aws:bedrock:us-east-1::foundation-model/anthropic.claude-3-5-sonnet-20240620-v1:0',
    ],
}));
// create a new API stack
const apiStack = backend.createStack('api-stack');
// create a new HTTP Lambda integration
const httpLambdaIntegration = new HttpLambdaIntegration('VaccineLambdaIntegration', backend.vaccineApi.resources.lambda);
// create a new HTTP API
const httpApi = new HttpApi(apiStack, 'VaccineHttpApi', {
    apiName: 'vaccine-api',
    corsPreflight: {
        allowMethods: [
            CorsHttpMethod.GET,
            CorsHttpMethod.POST,
            CorsHttpMethod.PUT,
            CorsHttpMethod.DELETE,
        ],
        allowOrigins: ['*'],
        allowHeaders: ['*'],
    },
    createDefaultStage: true,
});
// add routes to the API
httpApi.addRoutes({
    path: '/api/parse-vaccine-history',
    methods: [HttpMethod.POST],
    integration: httpLambdaIntegration,
});
httpApi.addRoutes({
    path: '/api/vaccine-catchup',
    methods: [HttpMethod.POST],
    integration: httpLambdaIntegration,
});
// add outputs to the configuration file
backend.addOutput({
    custom: {
        API: {
            [httpApi.httpApiName]: {
                endpoint: httpApi.url,
                region: Stack.of(httpApi).region,
                apiName: httpApi.httpApiName,
            },
        },
    },
});
