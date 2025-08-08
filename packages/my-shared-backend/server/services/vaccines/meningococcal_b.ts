import { VaccineDoseInfo, addDays, getAgeInYears } from '../vaccine-catchup';
import type { VaccineRecommendation } from '@shared/schema';

export function meningococcalBRecommendation(
  normalizedName: string,
  birthDate: Date,
  currentDate: Date,
  validDoses: VaccineDoseInfo[],
  numDoses: number,
  sortedDoses: VaccineDoseInfo[]
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
    return {
      vaccineName: normalizedName,
      recommendation: 'MenB vaccination based on shared clinical decision-making',
      nextDoseDate: undefined,
      seriesComplete: false,
      notes: ['Preferred age 16-18 years', 'Discuss benefits and risks with provider']
    };
  }
} 