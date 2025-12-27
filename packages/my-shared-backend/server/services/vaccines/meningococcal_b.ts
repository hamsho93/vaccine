import { VaccineDoseInfo, addDays, getAgeInYears } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function meningococcalBRecommendation(
  normalizedName: string,
  birthDate: Date,
  currentDate: Date,
  validDoses: VaccineDoseInfo[],
  numDoses: number,
  sortedDoses: VaccineDoseInfo[],
  specialConditions: SpecialConditions,
  immunityEvidence?: Record<string, boolean>
): VaccineRecommendation | null {
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  
  if (currentAgeYears < 10) {
    return {
      vaccineName: normalizedName,
      recommendation: 'MenB vaccination not recommended for children under 10 years',
      nextDoseDate: undefined,
      seriesComplete: true,
      notes: ['MenB vaccine minimum age is 10 years', 'Routine recommendation begins at 16-23 years with shared clinical decision-making']
    };
  } else if (currentAgeYears >= 10 && currentAgeYears < 16) {
    return {
      vaccineName: normalizedName,
      recommendation: 'MenB vaccination available for high-risk children',
      nextDoseDate: undefined,
      seriesComplete: false,
      notes: ['For high-risk conditions: asplenia, complement deficiency', 'Routine vaccination recommended at 16-23 years']
    };
  } else {
    // Ages 16-23: Shared clinical decision-making
    return {
      vaccineName: normalizedName,
      recommendation: 'MenB vaccination based on shared clinical decision-making',
      nextDoseDate: undefined,
      seriesComplete: false,
      notes: [
        'Preferred age 16-18 years', 
        'Discuss benefits and risks with provider',
        'Consider for college students, military recruits, and those at increased risk',
        'Two vaccines available: Bexsero (2 doses) or Trumenba (2-3 doses)'
      ],
      decisionType: 'shared-clinical-decision' as const
    };
  }
} 