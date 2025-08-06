import { VaccineDoseInfo, VaccineRecommendation, getAgeInYears } from '../vaccine-catchup.ts';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function yellowFeverRecommendation(
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
  
  // Yellow Fever is a travel vaccine for specific endemic areas
  recommendation = 'Yellow Fever vaccination not routinely recommended for US residents';
  seriesComplete = true;
  notes.push('Yellow Fever vaccine (YF-Vax, Stamaril) is required for:');
  notes.push('• Travel to countries with YF transmission risk');
  notes.push('• Entry requirements for certain countries');
  notes.push('• Endemic areas: sub-Saharan Africa, tropical South America');
  notes.push('NOT recommended for US mainland residents without travel');
  
  // Age restrictions and contraindications
  if (currentAgeYears < 1) {
    notes.push('⚠️ NOT recommended under 9 months (increased risk of encephalitis)');
    notes.push('Ages 6-8 months: only if high risk of exposure and cannot be avoided');
  } else if (currentAgeYears >= 60) {
    notes.push('⚠️ Age 60+: Increased risk of serious adverse events');
    notes.push('Consider risk-benefit analysis for first-time vaccination');
  }
  
  // Important safety information
  notes.push('Must be given at certified Yellow Fever vaccination centers');
  notes.push('Valid 10 days after vaccination for international travel');
  notes.push('Usually provides lifelong immunity (single dose sufficient)');
  notes.push('Contraindicated: immunocompromised, thymus disorders, severe egg allergy');
  
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