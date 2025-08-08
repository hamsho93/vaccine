import type { VaccineHistoryResult, CatchUpResult } from "@shared/schema";

// Backend API URL for the deployed vaccine service
const BACKEND_API_URL = 'https://76hqbcmos7.execute-api.us-east-1.amazonaws.com';

export class AmplifyVaccineService {
  async parseVaccineHistory(vaccineData: string, birthDate?: string): Promise<VaccineHistoryResult> {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/parse-vaccine-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vaccineData, birthDate }),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data as VaccineHistoryResult;
    } catch (error) {
      console.error('Failed to connect to backend API:', error);
      throw new Error('❌ Unable to connect to vaccine parsing service. Please check your connection and try again.');
    }
  }

  async generateCatchUpRecommendations(request: any): Promise<CatchUpResult> {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/vaccine-catchup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data as CatchUpResult;
    } catch (error) {
      console.error('Failed to connect to backend API:', error);
      throw new Error('❌ Unable to connect to vaccine recommendation service. Please check your connection and try again.');
    }
  }
}

export const amplifyVaccineService = new AmplifyVaccineService();