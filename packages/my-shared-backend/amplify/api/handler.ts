import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Support both API Gateway v1 (REST) and v2 (HTTP) event formats
type APIEvent = APIGatewayProxyEvent | any;

export const handler = async (
  event: APIEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
  };

  // Handle CORS preflight - support both API Gateway v1 and v2 formats
  const httpMethod = (event.requestContext?.http?.method) || event.httpMethod;
  const path = event.rawPath || event.path;
  
  if (httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  console.log('API Gateway event:', JSON.stringify(event, null, 2));

  try {
    // Route based on path
    if (path === '/parse-vaccine-history' || path === '/api/parse-vaccine-history') {
      const body = JSON.parse(event.body || '{}');
      const { vaccineData, birthDate } = body;

      // Simple mock response for now to test deployment
      const result = {
        success: true,
        vaccines: [],
        message: 'Vaccine parsing service is working! (Mock response)',
        inputData: { vaccineData, birthDate }
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }
    
    if (path === '/vaccine-catchup' || path === '/api/vaccine-catchup') {
      const body = JSON.parse(event.body || '{}');
      
      // Simple mock response for now to test deployment
      const result = {
        success: true,
        recommendations: [],
        message: 'Vaccine catch-up service is working! (Mock response)',
        inputData: body
      };

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // Health check endpoint
    if (path === '/health' || path === '/api/health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          endpoints: ['/api/parse-vaccine-history', '/api/vaccine-catchup'],
          environment: process.env.NODE_ENV || 'production',
          version: '1.0.0'
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        message: 'Not found',
        path: path,
        availableEndpoints: ['/api/parse-vaccine-history', '/api/vaccine-catchup', '/api/health']
      }),
    };
  } catch (error) {
    console.error('API error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        message: error instanceof Error ? error.message : 'Internal server error',
        type: 'api_error'
      }),
    };
  }
};