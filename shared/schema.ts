import { z } from "zod";
import { pgTable, serial, text, timestamp, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const VaccineDose = z.object({
  date: z.string(), // ISO date string
  patientAge: z.string(), // e.g., "3 months", "4 years"
});

export const VaccineRecord = z.object({
  vaccineName: z.string(),
  standardName: z.string(),
  abbreviation: z.string().optional(),
  doses: z.array(VaccineDose),
  seriesStatus: z.enum(["Complete", "Incomplete", "Unknown"]),
});

export const PatientInfo = z.object({
  dateOfBirth: z.string().optional(), // ISO date string
  currentAge: z.string().optional(),
  totalVaccines: z.number(),
});

export const VaccineHistoryResult = z.object({
  patientInfo: PatientInfo,
  vaccines: z.array(VaccineRecord),
  processingNotes: z.array(z.string()),
  cdcVersion: z.string(),
  processedAt: z.string(), // ISO date string
});

export const ParseVaccineHistoryRequest = z.object({
  vaccineData: z.string().min(1, "Vaccine data is required"),
  birthDate: z.string(), // ISO date string YYYY-MM-DD
});

export const VaccineRecommendation = z.object({
  vaccineName: z.string(),
  recommendation: z.string(),
  nextDoseDate: z.string().optional(), // ISO date string
  seriesComplete: z.boolean(),
  notes: z.array(z.string()),
});

export const CatchUpRequest = z.object({
  birthDate: z.string(), // ISO date string
  currentDate: z.string().optional(), // ISO date string, defaults to today
  vaccineHistory: z.array(z.object({
    vaccineName: z.string(),
    doses: z.array(z.object({
      date: z.string(), // ISO date string
    })),
  })),
});

export const CatchUpResult = z.object({
  patientAge: z.string(),
  recommendations: z.array(VaccineRecommendation),
  cdcVersion: z.string(),
  processedAt: z.string(),
});

export type VaccineDose = z.infer<typeof VaccineDose>;
export type VaccineRecord = z.infer<typeof VaccineRecord>;
export type PatientInfo = z.infer<typeof PatientInfo>;
export type VaccineHistoryResult = z.infer<typeof VaccineHistoryResult>;
export type ParseVaccineHistoryRequest = z.infer<typeof ParseVaccineHistoryRequest>;
export type VaccineRecommendation = z.infer<typeof VaccineRecommendation>;
export type CatchUpRequest = z.infer<typeof CatchUpRequest>;
export type CatchUpResult = z.infer<typeof CatchUpResult>;

// Database Tables
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vaccineHistoryRecords = pgTable("vaccine_history_records", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  sessionId: text("session_id").notNull(), // For anonymous sessions
  rawData: text("raw_data").notNull(),
  structuredData: jsonb("structured_data").notNull(),
  processingNotes: text("processing_notes").array(),
  cdcVersion: text("cdc_version").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

export const catchUpRecommendations = pgTable("catch_up_recommendations", {
  id: serial("id").primaryKey(),
  historyRecordId: integer("history_record_id").references(() => vaccineHistoryRecords.id),
  sessionId: text("session_id").notNull(),
  patientAge: text("patient_age").notNull(),
  recommendations: jsonb("recommendations").notNull(),
  cdcVersion: text("cdc_version").notNull(),
  processedAt: timestamp("processed_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUser = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertVaccineHistoryRecord = createInsertSchema(vaccineHistoryRecords).omit({ 
  id: true, 
  processedAt: true 
});
export const insertCatchUpRecommendation = createInsertSchema(catchUpRecommendations).omit({ 
  id: true, 
  processedAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUser>;
export type VaccineHistoryRecord = typeof vaccineHistoryRecords.$inferSelect;
export type InsertVaccineHistoryRecord = z.infer<typeof insertVaccineHistoryRecord>;
export type CatchUpRecommendationRecord = typeof catchUpRecommendations.$inferSelect;
export type InsertCatchUpRecommendation = z.infer<typeof insertCatchUpRecommendation>;
