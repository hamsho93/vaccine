import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { VaccineParserService } from '../../server/services/vaccine-parser';
import { VaccineCatchUpService } from '../../server/services/vaccine-catchup';

// Support both API Gateway v1 (REST) and v2 (HTTP) event formats
type APIEvent = APIGatewayProxyEvent | any;

export const handler = async (
  event: APIEvent
): Promise<APIGatewayProxyResult> => {
  // Tighten CORS: allow only the deployed Amplify frontend domain
  const allowedOrigin = process.env.ALLOWED_ORIGIN || 'https://d2ahzdteujgz7m.amplifyapp.com';
  const requestOrigin = event.headers?.origin || event.headers?.Origin;
  const corsOrigin = requestOrigin && requestOrigin === allowedOrigin ? allowedOrigin : allowedOrigin;

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
  } as const;

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

      if (!vaccineData) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing required field: vaccineData',
            expected: { vaccineData: 'string', birthDate: 'string (optional)' }
          }),
        };
      }

      // Use real vaccine parser service
      console.log('Using real vaccine parser for:', { vaccineData: vaccineData.substring(0, 100) + '...', birthDate });
      
      const parserService = new VaccineParserService();
      const result = await parserService.parseVaccineHistory(vaccineData, birthDate);
      
      console.log('Parser result:', JSON.stringify(result, null, 2));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }
    
    if (path === '/vaccine-catchup' || path === '/api/vaccine-catchup') {
      const body = JSON.parse(event.body || '{}');
      
      if (!body.birthDate || !body.vaccineHistory) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing required fields: birthDate and vaccineHistory',
            expected: { birthDate: 'string', vaccineHistory: 'array', specialConditions: 'object (optional)' }
          }),
        };
      }

      // Use real catch-up service
      console.log('Using real catch-up service for:', { 
        birthDate: body.birthDate, 
        vaccineHistoryCount: body.vaccineHistory?.length 
      });
      
      const catchUpService = new VaccineCatchUpService();
      const result = await catchUpService.generateCatchUpRecommendations(body);
      
      console.log('Catch-up result:', JSON.stringify(result, null, 2));

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