import { VaccineDoseInfo, getAgeInMonths, getAgeInYears } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { getVaccineRules, SpecialConditions } from '../vaccine-cdc-rules';

export function covid19Recommendation(
  normalizedName: string,
  birthDate: Date,
  currentDate: Date,
  validDoses: VaccineDoseInfo[],
  numDoses: number,
  sortedDoses: VaccineDoseInfo[],
  specialConditions: SpecialConditions,
  immunityEvidence: any
): VaccineRecommendation {
  let seriesComplete = false;
  let recommendation = '';
  const nextDoseDate: string | undefined = undefined;
  const notes: string[] = [];
  
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
  
  // CDC 2025 COVID-19 guidelines implementation (routine vaccination for ≥6 months)
  const isImmunocompromised = specialConditions?.immunocompromised;

  // Minimum age check - Moderna/Pfizer minimum age 6 months; Novavax min age 12 years
  if (currentAgeMonths < 6) {
    recommendation = 'COVID-19 vaccination not recommended under 6 months';
    seriesComplete = true;
    notes.push('Minimum age: 6 months (Moderna, Pfizer-BioNTech)');
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
  }

  // Age-based routine recommendations; use manufacturer-agnostic summaries
  if (currentAgeYears < 5) {
    // 6 months–4 years
    if (isImmunocompromised) {
      recommendation = 'Give COVID-19 dose now per immunocompromised schedule';
      notes.push('Moderately/severely immunocompromised: additional doses indicated');
      notes.push('Use same manufacturer for series when possible');
    } else {
      recommendation = numDoses === 0 ? 'Give COVID-19 dose 1 now' : 'COVID-19 up to date if received current season dose';
      notes.push('Primary series per manufacturer (2-dose Moderna or 3-dose Pfizer for naive)');
      notes.push('Use current season formulation');
    }
  } else if (currentAgeYears >= 5 && currentAgeYears <= 11) {
    if (isImmunocompromised) {
      recommendation = 'Give COVID-19 dose now per immunocompromised schedule';
      notes.push('Additional doses recommended for immunocompromised');
    } else {
      recommendation = numDoses === 0 ? 'Give 1 dose of current season COVID-19 vaccine now' : 'May give 1 dose of current season formulation';
      notes.push('Current season formulation recommended');
    }
  } else if (currentAgeYears >= 12 && currentAgeYears <= 17) {
    if (isImmunocompromised) {
      recommendation = 'Give COVID-19 dose now per immunocompromised schedule';
      notes.push('Additional doses recommended for immunocompromised');
    } else {
      recommendation = numDoses === 0 ? 'Give 1 dose of current season COVID-19 vaccine now' : 'May give 1 dose of current season formulation';
      notes.push('Available vaccines: Moderna, Pfizer-BioNTech, Novavax');
    }
  }

  // Important clinical notes from CDC 2025
  notes.push('Use same manufacturer for series when possible');
  notes.push('Use current season formulation');

  // Decision type: routine unless special clinical decision required
  const decisionType = 'routine' as const;

  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes, decisionType };
}