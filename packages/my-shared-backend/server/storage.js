export class DatabaseStorage {
    async saveVaccineHistory(sessionId, rawData, result, userId) {
        console.log('🔄 Mock: saveVaccineHistory called in Lambda mode');
        return {
            id: 1,
            userId,
            sessionId,
            rawData,
            parsedData: result,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    async getVaccineHistoryBySession(sessionId) {
        console.log('🔄 Mock: getVaccineHistoryBySession called in Lambda mode');
        return undefined;
    }
    async saveCatchUpRecommendations(sessionId, result, historyRecordId) {
        console.log('🔄 Mock: saveCatchUpRecommendations called in Lambda mode');
        return {
            id: 1,
            historyRecordId,
            sessionId,
            recommendations: result,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }
    async getCatchUpRecommendationsBySession(sessionId) {
        console.log('🔄 Mock: getCatchUpRecommendationsBySession called in Lambda mode');
        return undefined;
    }
}
export const storage = new DatabaseStorage();
