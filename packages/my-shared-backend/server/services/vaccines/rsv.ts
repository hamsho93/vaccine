import { VaccineDoseInfo, getAgeInMonths, getAgeInYears } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function rsvRecommendation(
  normalizedName: string,
  birthDate: Date,
  currentDate: Date,
  validDoses: VaccineDoseInfo[],
  numDoses: number,
  sortedDoses: VaccineDoseInfo[],
  specialConditions: SpecialConditions,
  immunityEvidence: any
): VaccineRecommendation | null {
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  
  // CDC 2025: RSV vaccine (Abrysvo) is for pregnant women at 32-36 weeks gestation
  // This is NOT a vaccine for children/adolescents
  // Nirsevimab (monoclonal antibody) is for infants, but that's separate from RSV vaccine
  
  // RSV vaccine is not recommended for children/adolescents
  // Return null to exclude from recommendations, or show aged-out status
  return {
    vaccineName: normalizedName,
    recommendation: 'RSV vaccine not recommended for children/adolescents',
    nextDoseDate: undefined,
    seriesComplete: true,
    notes: [
      'RSV vaccine (Abrysvo) is for pregnant women at 32-36 weeks gestation (September-January)',
      'Not indicated for children or adolescents',
      'Nirsevimab (monoclonal antibody) is available for infants but is separate from RSV vaccine',
      'For maternal RSV vaccination, consult pregnancy immunization guidelines'
    ],
    decisionType: 'not-recommended' as const
  };
} 