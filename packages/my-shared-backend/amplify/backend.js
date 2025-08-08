import { defineBackend } from '@aws-amplify/backend';
import { Stack } from 'aws-cdk-lib';
import { CorsHttpMethod, HttpApi, HttpMethod, } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { vaccineApi } from './api/resource';
const backend = defineBackend({
    auth,
    data,
    vaccineApi,
});
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
