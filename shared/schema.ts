import { z } from "zod";

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
