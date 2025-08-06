import { Amplify } from 'aws-amplify';
import type { VaccineHistoryResult, CatchUpResult } from "@shared/schema";

export class AmplifyVaccineService {
  async parseVaccineHistory(vaccineData: string, birthDate?: string): Promise<VaccineHistoryResult> {
    try {
      // For now, we'll fall back to direct API calls
      // In a real Amplify setup, this would use the function URL from amplify_outputs.json
      const response = await fetch('/api/parse-vaccine-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vaccineData,
          birthDate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as VaccineHistoryResult;
    } catch (error) {
      console.error('Error parsing vaccine history:', error);
      throw error;
    }
  }

  async generateCatchUpRecommendations(request: any): Promise<CatchUpResult> {
    try {
      const response = await fetch('/api/vaccine-catchup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json() as CatchUpResult;
    } catch (error) {
      console.error('Error generating catch-up recommendations:', error);
      throw error;
    }
  }
}

export const amplifyVaccineService = new AmplifyVaccineService();