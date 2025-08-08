// Storage functionality simplified for Lambda deployment
import { randomUUID } from "crypto";
import type { VaccineHistoryResult, CatchUpResult } from "../shared/schema";

export interface IStorage {
  // Vaccine history operations - simplified for Lambda
  saveVaccineHistory(sessionId: string, rawData: string, result: VaccineHistoryResult, userId?: number): Promise<any>;
  getVaccineHistoryBySession(sessionId: string): Promise<any>;
  
  // Catch-up recommendations operations - simplified for Lambda
  saveCatchUpRecommendations(sessionId: string, result: CatchUpResult, historyRecordId?: number): Promise<any>;
  getCatchUpRecommendationsBySession(sessionId: string): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async saveVaccineHistory(sessionId: string, rawData: string, result: VaccineHistoryResult, userId?: number): Promise<any> {
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

  async getVaccineHistoryBySession(sessionId: string): Promise<any> {
    console.log('🔄 Mock: getVaccineHistoryBySession called in Lambda mode');
    return undefined;
  }

  async saveCatchUpRecommendations(sessionId: string, result: CatchUpResult, historyRecordId?: number): Promise<any> {
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

  async getCatchUpRecommendationsBySession(sessionId: string): Promise<any> {
    console.log('🔄 Mock: getCatchUpRecommendationsBySession called in Lambda mode');
    return undefined;
  }
}

export const storage: IStorage = new DatabaseStorage();