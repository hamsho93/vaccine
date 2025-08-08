import { VaccineCatchUpService } from '../../../server/services/vaccine-catchup';
const vaccineCatchUp = new VaccineCatchUpService();
export const handler = async (event) => {
    try {
        const body = JSON.parse(event.body || '{}');
        const result = await vaccineCatchUp.generateCatchUpRecommendations(body);
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
        console.error('Error in vaccine-catchup:', error);
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                message: error instanceof Error ? error.message : 'Internal server error',
                type: 'catchup_error'
            }),
        };
    }
};
