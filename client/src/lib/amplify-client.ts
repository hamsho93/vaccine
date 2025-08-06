import { post } from 'aws-amplify/api';
import type { VaccineHistoryResult, CatchUpResult } from "@shared/schema";

// Note: Currently no backend deployed, fallback will show helpful error
const FALLBACK_API_URL = 'https://main.d2vu6k1z6ytpqs.amplifyapp.com';

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
      
      // Fallback to direct fetch call
      try {
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

        const data = await response.json();
        return data as VaccineHistoryResult;
      } catch (fetchError) {
        console.error('Both Amplify and fallback failed:', fetchError);
        throw new Error('🚧 Backend API not yet deployed. The vaccine parsing service will be available once the backend is deployed.');
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
      
      // Fallback to direct fetch call
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

        const data = await response.json();
        return data as CatchUpResult;
              } catch (fetchError) {
          console.error('Both Amplify and fallback failed:', fetchError);
          throw new Error('🚧 Backend API not yet deployed. The vaccine recommendation service will be available once the backend is deployed.');
        }
    }
  }
}

export const amplifyVaccineService = new AmplifyVaccineService();