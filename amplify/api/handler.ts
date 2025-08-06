import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { VaccineParserService } from '../../../server/services/vaccine-parser.js';
import { VaccineCatchUpService } from '../../../server/services/vaccine-catchup.js';

const vaccineParser = new VaccineParserService();
const vaccineCatchUp = new VaccineCatchUpService();

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-ID',
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  console.log('API Gateway event:', JSON.stringify(event, null, 2));

  try {
    // Route based on path
    if (event.path === '/parse-vaccine-history' || event.path === '/api/parse-vaccine-history') {
      const body = JSON.parse(event.body || '{}');
      const { vaccineData, birthDate } = body;

      const result = await vaccineParser.parseVaccineHistory(vaccineData, birthDate);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }
    
    if (event.path === '/vaccine-catchup' || event.path === '/api/vaccine-catchup') {
      const body = JSON.parse(event.body || '{}');
      
      const result = await vaccineCatchUp.generateCatchUpRecommendations(body);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result),
      };
    }

    // Health check endpoint
    if (event.path === '/health' || event.path === '/api/health') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          status: 'healthy', 
          timestamp: new Date().toISOString(),
          endpoints: ['/api/parse-vaccine-history', '/api/vaccine-catchup']
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ 
        message: 'Not found',
        path: event.path,
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