import { VaccineDoseInfo, getAgeInYears } from '../vaccine-catchup';
import type { VaccineRecommendation } from '@shared/schema';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function typhoidRecommendation(
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
  let nextDoseDate: string | undefined = undefined;
  const notes: string[] = [];
  
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  
  // Typhoid is a travel vaccine for specific risk areas
  recommendation = 'Typhoid vaccination not routinely recommended for US residents';
  seriesComplete = true;
  notes.push('Typhoid vaccine (Typhim Vi, Vivotif) recommended for:');
  notes.push('• Travel to areas with poor sanitation/food safety');
  notes.push('• High-risk destinations: South Asia, Africa, Latin America');
  notes.push('• Adventure travelers, visiting friends/relatives abroad');
  notes.push('• Laboratory workers exposed to S. Typhi');
  notes.push('NOT recommended for routine US vaccination');
  
  // Age and vaccine type considerations
  if (currentAgeYears < 2) {
    notes.push('Injectable vaccine (Typhim Vi): minimum age 2 years');
    notes.push('Oral vaccine (Vivotif): minimum age 6 years');
  } else if (currentAgeYears < 6) {
    notes.push('Only injectable vaccine (Typhim Vi) available for ages 2-5');
  } else {
    notes.push('Two options: Injectable (Typhim Vi) or oral (Vivotif) vaccine');
  }
  
  // Duration and boosters
  notes.push('Injectable vaccine: protective for 3 years');
  notes.push('Oral vaccine: protective for 5 years');
  notes.push('Booster needed for continued risk');
  notes.push('Take at least 1-2 weeks before travel for full protection');
  
  return { 
    vaccineName: normalizedName, 
    recommendation, 
    nextDoseDate, 
    seriesComplete, 
    notes,
    decisionType: 'international-advisory' as const,
    contraindications: [],
    precautions: [],
    specialSituations: []
  };
}