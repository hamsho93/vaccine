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
  
  // CDC 2025 COVID-19 guidelines implementation
  const isImmunocompromised = specialConditions?.immunocompromised;
  
  // Minimum age check - Moderna and Pfizer minimum age 6 months, Novavax minimum age 12 years
  if (currentAgeMonths < 6) {
    recommendation = 'COVID-19 vaccination not recommended under 6 months';
    seriesComplete = true;
    notes.push('Minimum age: 6 months (Moderna, Pfizer-BioNTech)');
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
  }
  
  // Age-based recommendations per CDC 2025 Schedule Notes
  if (currentAgeMonths >= 6 && currentAgeYears < 5) {
    // Ages 6 months - 4 years: Shared clinical decision-making
    if (isImmunocompromised) {
      recommendation = 'COVID-19 vaccination recommended - consult provider for immunocompromised schedule';
      notes.push('Moderately/severely immunocompromised: follow immunocompromised schedule');
      notes.push('Additional doses may be needed based on immune status');
    } else {
      recommendation = 'COVID-19 vaccination available based on shared clinical decision-making';
      notes.push('Ages 6 months-4 years: shared clinical decision-making with provider');
      notes.push('Unvaccinated: 2 doses Moderna (4-8 weeks apart) OR 3 doses Pfizer-BioNTech');
      notes.push('All doses should be from same manufacturer');
    }
  } else if (currentAgeYears >= 5 && currentAgeYears <= 11) {
    // Ages 5-11 years: Shared clinical decision-making
    if (isImmunocompromised) {
      recommendation = 'COVID-19 vaccination recommended - consult provider for immunocompromised schedule';
      notes.push('Moderately/severely immunocompromised: additional doses needed');
    } else {
      recommendation = 'COVID-19 vaccination available based on shared clinical decision-making';
      notes.push('Ages 5-11 years: shared clinical decision-making with provider');
      if (numDoses === 0) {
        notes.push('Unvaccinated: 1 dose 2024-25 vaccine');
      } else {
        notes.push('May receive 1 dose 2024-25 vaccine if desired');
      }
    }
  } else if (currentAgeYears >= 12 && currentAgeYears <= 17) {
    // Ages 12-17 years: Shared clinical decision-making
    if (isImmunocompromised) {
      recommendation = 'COVID-19 vaccination recommended - consult provider for immunocompromised schedule';
      notes.push('Moderately/severely immunocompromised: additional doses needed');
      notes.push('Follow enhanced schedule for immunocompromised persons');
    } else {
      recommendation = 'COVID-19 vaccination available based on shared clinical decision-making';
      notes.push('Ages 12-17 years: shared clinical decision-making with provider');
      if (numDoses === 0) {
        notes.push('Unvaccinated: 1 dose 2024-25 vaccine');
      } else {
        notes.push('May receive 1 dose 2024-25 vaccine if desired');
      }
    }
  }
  
  // Vaccine product availability by age
  if (currentAgeMonths >= 6 && currentAgeYears < 12) {
    notes.push('Available vaccines: Moderna, Pfizer-BioNTech');
  } else if (currentAgeYears >= 12) {
    notes.push('Available vaccines: Moderna, Pfizer-BioNTech, Novavax');
  }
  
  // Important clinical notes from CDC 2025
  notes.push('Use same manufacturer for series when possible');
  notes.push('Current 2024-25 formulation recommended');
  
  // Set decision type based on CDC 2025 shared clinical decision-making guidance
  const decisionType = isImmunocompromised ? 'routine' : 'shared-clinical-decision';
  
  return { 
    vaccineName: normalizedName, 
    recommendation, 
    nextDoseDate, 
    seriesComplete, 
    notes,
    decisionType: decisionType
  };
}