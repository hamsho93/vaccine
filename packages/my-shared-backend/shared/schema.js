import { z } from "zod";
export const VaccineDose = z.object({
    date: z.string(),
    patientAge: z.string(),
});
export const VaccineRecord = z.object({
    vaccineName: z.string(),
    standardName: z.string(),
    abbreviation: z.string().optional(),
    doses: z.array(VaccineDose),
    seriesStatus: z.enum(["Complete", "Incomplete", "Unknown"]),
});
export const PatientInfo = z.object({
    dateOfBirth: z.string().optional(),
    currentAge: z.string().optional(),
    totalVaccines: z.number(),
});
export const VaccineHistoryResult = z.object({
    patientInfo: PatientInfo,
    vaccines: z.array(VaccineRecord),
    processingNotes: z.array(z.string()),
    cdcVersion: z.string(),
    processedAt: z.string(),
});
export const ParseVaccineHistoryRequest = z.object({
    vaccineData: z.string().min(1, "Vaccine data is required"),
    birthDate: z.string(),
});
export const VaccineRecommendation = z.object({
    vaccineName: z.string(),
    recommendation: z.string(),
    nextDoseDate: z.string().optional(),
    seriesComplete: z.boolean(),
    notes: z.array(z.string()),
    decisionType: z.enum(["routine", "catch-up", "shared-clinical-decision", "risk-based", "not-recommended", "international-advisory", "aged-out"]).optional(),
    contraindications: z.array(z.string()).optional(),
    precautions: z.array(z.string()).optional(),
    specialSituations: z.array(z.string()).optional(),
});
export const CatchUpRequest = z.object({
    birthDate: z.string(),
    currentDate: z.string().optional(),
    vaccineHistory: z.array(z.object({
        vaccineName: z.string(),
        doses: z.array(z.object({
            date: z.string(),
            product: z.string().optional(),
        })),
    })),
    specialConditions: z.object({
        immunocompromised: z.boolean().optional(),
        pregnancy: z.boolean().optional(),
        hivInfection: z.boolean().optional(),
        asplenia: z.boolean().optional(),
        cochlearImplant: z.boolean().optional(),
        csfLeak: z.boolean().optional(),
        diabetes: z.boolean().optional(),
        chronicHeartDisease: z.boolean().optional(),
        chronicLungDisease: z.boolean().optional(),
        chronicLiverDisease: z.boolean().optional(),
        chronicKidneyDisease: z.boolean().optional(),
    }).optional(),
    immunityEvidence: z.record(z.string(), z.boolean()).optional(),
});
export const CatchUpResult = z.object({
    patientAge: z.string(),
    recommendations: z.array(VaccineRecommendation),
    cdcVersion: z.string(),
    processedAt: z.string(),
});
