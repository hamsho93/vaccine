import { 
  users, 
  vaccineHistoryRecords, 
  catchUpRecommendations,
  type User, 
  type InsertUser,
  type VaccineHistoryRecord,
  type InsertVaccineHistoryRecord,
  type CatchUpRecommendationRecord,
  type InsertCatchUpRecommendation,
  type VaccineHistoryResult,
  type CatchUpResult
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Vaccine history operations
  saveVaccineHistory(sessionId: string, rawData: string, result: VaccineHistoryResult, userId?: number): Promise<VaccineHistoryRecord>;
  getVaccineHistoryBySession(sessionId: string): Promise<VaccineHistoryRecord | undefined>;
  
  // Catch-up recommendations operations
  saveCatchUpRecommendations(sessionId: string, result: CatchUpResult, historyRecordId?: number): Promise<CatchUpRecommendationRecord>;
  getCatchUpRecommendationsBySession(sessionId: string): Promise<CatchUpRecommendationRecord | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async saveVaccineHistory(sessionId: string, rawData: string, result: VaccineHistoryResult, userId?: number): Promise<VaccineHistoryRecord> {
    const [record] = await db
      .insert(vaccineHistoryRecords)
      .values({
        userId,
        sessionId,
        rawData,
        structuredData: result,
        processingNotes: result.processingNotes,
        cdcVersion: result.cdcVersion,
      })
      .returning();
    return record;
  }

  async getVaccineHistoryBySession(sessionId: string): Promise<VaccineHistoryRecord | undefined> {
    const [record] = await db
      .select()
      .from(vaccineHistoryRecords)
      .where(eq(vaccineHistoryRecords.sessionId, sessionId))
      .orderBy(vaccineHistoryRecords.processedAt);
    return record || undefined;
  }

  async saveCatchUpRecommendations(sessionId: string, result: CatchUpResult, historyRecordId?: number): Promise<CatchUpRecommendationRecord> {
    const [record] = await db
      .insert(catchUpRecommendations)
      .values({
        historyRecordId,
        sessionId,
        patientAge: result.patientAge,
        recommendations: result.recommendations,
        cdcVersion: result.cdcVersion,
      })
      .returning();
    return record;
  }

  async getCatchUpRecommendationsBySession(sessionId: string): Promise<CatchUpRecommendationRecord | undefined> {
    const [record] = await db
      .select()
      .from(catchUpRecommendations)
      .where(eq(catchUpRecommendations.sessionId, sessionId))
      .orderBy(catchUpRecommendations.processedAt);
    return record || undefined;
  }
}

export const storage = new DatabaseStorage();
