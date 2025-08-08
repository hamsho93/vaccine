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

      // Enhanced mock response with structured data
      const result = {
        success: true,
        vaccines: [
          {
            vaccineName: "MMR",
            standardName: "Measles, Mumps, Rubella",
            doses: [
              {
                date: "2020-01-15",
                patientAge: "12 months"
              }
            ],
            seriesComplete: false,
            nextDoseDate: "2021-01-15",
            notes: ["Second dose recommended at 4-6 years"]
          }
        ],
        message: 'Vaccine parsing completed successfully',
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
      
      if (!body.birthDate || !body.vaccines) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            error: 'Missing required fields: birthDate and vaccines',
            expected: { birthDate: 'string', vaccines: 'array' }
          }),
        };
      }

      // Enhanced mock response with recommendation structure
      const result = {
        success: true,
        recommendations: [
          {
            vaccineName: "MMR",
            recommendation: "Give MMR dose 2 now",
            nextDoseDate: "2025-08-08",
            seriesComplete: false,
            notes: ["Second dose due", "Patient is behind on MMR schedule"],
            decisionType: "routine"
          },
          {
            vaccineName: "DTaP",
            recommendation: "Give DTaP dose 1 now", 
            nextDoseDate: "2025-08-08",
            seriesComplete: false,
            notes: ["Starting primary series"],
            decisionType: "routine"
          }
        ],
        message: 'Catch-up recommendations generated successfully',
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