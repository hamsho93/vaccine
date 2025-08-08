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
  const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  
  // RSV immunization (nirsevimab) became available in August 2023
  // Children born before 2023 who are now 2+ years were too old when vaccine became available
  const rsvAvailableDate = new Date(2023, 7, 1); // August 2023
  const patientBirthYear = birthDate.getFullYear();
  
  if (currentAgeYears >= 2 && patientBirthYear < 2023) {
    // Patient was too old when RSV vaccine became available
    return {
      vaccineName: normalizedName,
      recommendation: 'RSV immunization not available - patient was too old when vaccine became available',
      nextDoseDate: undefined,
      seriesComplete: false,
      notes: [
        '⏰ Patient aged out: Born before RSV vaccine availability (August 2023)',
        'RSV immunization (nirsevimab) was not available for children born before 2023',
        'Vaccine became available when patient was already 2+ years old',
        'RSV immunization is primarily for infants and high-risk young children'
      ],
      decisionType: 'aged-out' as const
    };
  }
  
  if (currentAgeYears >= 2) {
    return {
      vaccineName: normalizedName,
      recommendation: 'RSV immunization not routinely recommended for children 2+ years',
      nextDoseDate: undefined,
      seriesComplete: true,
      notes: ['RSV immunization primarily for infants and high-risk young children']
    };
  } else if (currentAgeMonths >= 8 && currentAgeMonths < 24) {
    return {
      vaccineName: normalizedName,
      recommendation: 'RSV immunization may be considered for high-risk children',
      nextDoseDate: undefined,
      seriesComplete: false,
      notes: ['Consult provider for individual risk assessment', 'Consider for severe immunocompromise or chronic conditions']
    };
  } else {
    return {
      vaccineName: normalizedName,
      recommendation: 'RSV immunization recommended for infants',
      nextDoseDate: undefined,
      seriesComplete: false,
      notes: ['Nirsevimab recommended for infants during RSV season']
    };
  }
} 