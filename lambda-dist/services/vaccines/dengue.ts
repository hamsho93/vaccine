import { VaccineDoseInfo, VaccineRecommendation, getAgeInYears } from '../vaccine-catchup.ts';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function dengueRecommendation(
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
  
  // Geographic restriction - Dengue vaccine only for specific endemic areas
  // Based on CDC 2021 ACIP recommendations: Puerto Rico, American Samoa, U.S. Virgin Islands,
  // Federated States of Micronesia, Republic of Marshall Islands, Republic of Palau
  recommendation = 'Dengue vaccination not recommended for US-based patients';
  seriesComplete = true;
  notes.push('Dengue vaccine (Dengvaxia) only recommended for endemic areas:');
  notes.push('• Puerto Rico, American Samoa, U.S. Virgin Islands');
  notes.push('• Federated States of Micronesia, Marshall Islands, Palau');
  notes.push('NOT recommended for US mainland residents or travelers');
  notes.push('Requires laboratory-confirmed previous dengue infection');
  
  // Age restriction
  if (currentAgeYears < 9 || currentAgeYears > 16) {
    notes.push('Age restriction: Only approved for ages 9-16 years in endemic areas');
  }
  
  // Important safety information
  notes.push('⚠️ Can increase severe dengue risk if no previous infection');
  notes.push('Requires pre-vaccination screening for previous dengue exposure');
  
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