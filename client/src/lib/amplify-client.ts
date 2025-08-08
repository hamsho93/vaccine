import { post } from 'aws-amplify/api';
import type { VaccineHistoryResult, CatchUpResult } from "@shared/schema";

// Backend API URL for the deployed vaccine service
const BACKEND_API_URL = 'https://76hqbcmos7.execute-api.us-east-1.amazonaws.com';

export class AmplifyVaccineService {
  async parseVaccineHistory(vaccineData: string, birthDate?: string): Promise<VaccineHistoryResult> {
    try {
      // Try Amplify API first
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
    } catch (amplifyError) {
      console.warn('Amplify API failed, trying fallback:', amplifyError);
      
      // Fallback to direct backend API call
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/parse-vaccine-history`, {
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

        const data = await response.json();
        return data as VaccineHistoryResult;
      } catch (fetchError) {
        console.error('Both Amplify and fallback failed:', fetchError);
        throw new Error('❌ Unable to connect to vaccine parsing service. Please check your connection and try again.');
      }
    }
  }

  async generateCatchUpRecommendations(request: any): Promise<CatchUpResult> {
    try {
      // Try Amplify API first
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
    } catch (amplifyError) {
      console.warn('Amplify API failed, trying fallback:', amplifyError);
      
      // Fallback to direct backend API call
      try {
        const response = await fetch(`${BACKEND_API_URL}/api/vaccine-catchup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data as CatchUpResult;
              } catch (fetchError) {
          console.error('Both Amplify and fallback failed:', fetchError);
          throw new Error('❌ Unable to connect to vaccine recommendation service. Please check your connection and try again.');
        }
    }
  }
}

export const amplifyVaccineService = new AmplifyVaccineService();