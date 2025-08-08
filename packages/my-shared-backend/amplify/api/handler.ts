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

      // Enhanced mock response matching VaccineHistoryResult schema
      const result = {
        patientInfo: {
          dateOfBirth: birthDate || "2010-09-21",
          currentAge: birthDate ? `${new Date().getFullYear() - new Date(birthDate).getFullYear()} years` : "14 years",
          totalVaccines: 3
        },
        vaccines: [
          {
            vaccineName: "MMR",
            standardName: "Measles, Mumps, Rubella",
            abbreviation: "MMR",
            doses: [
              {
                date: "2020-01-15",
                patientAge: "12 months"
              }
            ],
            seriesStatus: "Incomplete"
          },
          {
            vaccineName: "DTaP",
            standardName: "Diphtheria, Tetanus, Pertussis",
            abbreviation: "DTaP",
            doses: [
              {
                date: "2011-01-19",
                patientAge: "4 months"
              }
            ],
            seriesStatus: "Incomplete"
          },
          {
            vaccineName: "Hepatitis B",
            standardName: "Hepatitis B",
            abbreviation: "Hep B",
            doses: [
              {
                date: "2010-09-21",
                patientAge: "0 days"
              },
              {
                date: "2011-04-07",
                patientAge: "6 months"
              }
            ],
            seriesStatus: "Incomplete"
          }
        ],
        processingNotes: [
          "Parsed 3 vaccine series from input data",
          "Patient date of birth: " + (birthDate || "2010-09-21"),
          "Mock response - real parsing would extract more details"
        ],
        cdcVersion: "2025.1",
        processedAt: new Date().toISOString()
      };

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

      // Enhanced mock response matching CatchUpResult schema
      const birthYear = new Date(body.birthDate).getFullYear();
      const currentAge = new Date().getFullYear() - birthYear;
      
      const result = {
        patientAge: `${currentAge} years`,
        recommendations: [
          {
            vaccineName: "MMR",
            recommendation: "Give MMR dose 2 now",
            nextDoseDate: "2025-08-15",
            seriesComplete: false,
            notes: ["Second dose due", "Patient is behind on MMR schedule"],
            decisionType: "routine"
          },
          {
            vaccineName: "DTaP",
            recommendation: "Give DTaP dose 4 now", 
            nextDoseDate: "2025-08-15",
            seriesComplete: false,
            notes: ["Fourth dose due for catch-up", "Ensure minimum interval from previous dose"],
            decisionType: "catch-up"
          },
          {
            vaccineName: "Hepatitis B",
            recommendation: "Give Hepatitis B dose 3 now",
            nextDoseDate: "2025-08-15",
            seriesComplete: false,
            notes: ["Final dose to complete series", "Can be given with other vaccines"],
            decisionType: "routine"
          },
          {
            vaccineName: "Varicella",
            recommendation: "Give Varicella dose 1 now",
            nextDoseDate: "2025-08-15",
            seriesComplete: false,
            notes: ["Starting varicella series", "Second dose due in 4-8 weeks"],
            decisionType: "routine"
          },
          {
            vaccineName: "COVID-19",
            recommendation: "Discuss COVID-19 vaccination",
            seriesComplete: false,
            notes: ["Vaccination recommended based on current guidelines", "Discuss risks and benefits with patient/family"],
            decisionType: "shared-clinical-decision"
          }
        ],
        cdcVersion: "2025.1",
        processedAt: new Date().toISOString()
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