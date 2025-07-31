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

export type VaccineDose = z.infer<typeof VaccineDose>;
export type VaccineRecord = z.infer<typeof VaccineRecord>;
export type PatientInfo = z.infer<typeof PatientInfo>;
export type VaccineHistoryResult = z.infer<typeof VaccineHistoryResult>;
export type ParseVaccineHistoryRequest = z.infer<typeof ParseVaccineHistoryRequest>;
