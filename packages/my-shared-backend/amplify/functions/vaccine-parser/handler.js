import { VaccineParserService } from '../../../server/services/vaccine-parser';
const vaccineParser = new VaccineParserService();
export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const { vaccineData, birthDate } = body;
        const result = await vaccineParser.parseVaccineHistory(vaccineData, birthDate);
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
            },
            body: JSON.stringify(result),
        };
    }
    catch (error) {
        console.error('Error in vaccine-parser:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: error instanceof Error ? error.message : 'Internal server error',
                type: 'parsing_error'
            }),
        };
    }
};
