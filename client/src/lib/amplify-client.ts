import { post } from 'aws-amplify/api';
import type { VaccineHistoryResult, CatchUpResult } from "@shared/schema";

export class AmplifyVaccineService {
  async parseVaccineHistory(vaccineData: string, birthDate?: string): Promise<VaccineHistoryResult> {
    try {
      const operation = post({
        apiName: 'vaccine-api',
        path: '/api/parse-vaccine-history',
        options: {
          body: {
            vaccineData,
            birthDate
          }
        }
      });

      const response = await operation.response;
      const data = await response.body.json();
      return data as VaccineHistoryResult;
    } catch (error) {
      console.error('Error parsing vaccine history:', error);
      throw error;
    }
  }

  async generateCatchUpRecommendations(request: any): Promise<CatchUpResult> {
    try {
      const operation = post({
        apiName: 'vaccine-api', 
        path: '/api/vaccine-catchup',
        options: {
          body: request
        }
      });

      const response = await operation.response;
      const data = await response.body.json();
      return data as CatchUpResult;
    } catch (error) {
      console.error('Error generating catch-up recommendations:', error);
      throw error;
    }
  }
}

export const amplifyVaccineService = new AmplifyVaccineService();