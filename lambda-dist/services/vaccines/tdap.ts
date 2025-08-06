import { VaccineDoseInfo, getAgeInDays, getAgeInYears, VaccineRecommendation, formatDate } from '../vaccine-catchup.ts';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function tdapRecommendation(
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
  const currentAgeDays = getAgeInDays(birthDate, currentDate);
  
  // CDC 2025 Tdap guidelines
  const tdapMinAgeYears = 7; // Minimum age for catch-up
  const routineTdapAge = 11; // Routine adolescent booster age
  
  // Age restrictions
  if (currentAgeYears < tdapMinAgeYears) {
    recommendation = 'Use DTaP instead of Tdap for children under 7 years';
    seriesComplete = true;
    notes.push('Tdap minimum age: 7 years (for catch-up vaccination)');
    notes.push('Routine Tdap age: 11-12 years (adolescent booster)');
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
  }
  
  // Routine vaccination schedule
  if (currentAgeYears >= routineTdapAge && currentAgeYears <= 12) {
    // Adolescent booster age
    if (numDoses === 0) {
      recommendation = 'Give Tdap now (adolescent booster)';
      nextDoseDate = formatDate(currentDate);
      notes.push('Routine adolescent Tdap booster at 11-12 years');
      notes.push('One dose provides protection through adolescence');
    } else {
      recommendation = 'Tdap adolescent booster complete';
      seriesComplete = true;
      notes.push('Adolescent Tdap booster completed');
    }
  } else if (currentAgeYears >= 13 && currentAgeYears <= 18) {
    // Catch-up for teens who missed adolescent dose
    if (numDoses === 0) {
      recommendation = 'Give Tdap now (catch-up adolescent booster)';
      nextDoseDate = formatDate(currentDate);
      notes.push('Catch-up Tdap for teens who have not received adolescent booster');
    } else {
      recommendation = 'Tdap adolescent booster complete';
      seriesComplete = true;
      notes.push('Adolescent Tdap booster completed');
    }
  } else if (currentAgeYears >= 7 && currentAgeYears <= 10) {
    // Catch-up vaccination for incomplete DTaP series
    if (numDoses === 0) {
      recommendation = 'Give Tdap as part of catch-up series (preferably first dose)';
      nextDoseDate = formatDate(currentDate);
      notes.push('Tdap as part of catch-up series for incomplete DTaP');
      notes.push('If additional doses needed, use Td or Tdap');
      
      // Special case: if given at age 7-9, still need adolescent booster
      if (currentAgeYears >= 7 && currentAgeYears <= 9) {
        notes.push('Will still need adolescent Tdap booster at 11-12 years');
      } else if (currentAgeYears === 10) {
        notes.push('This dose counts as adolescent Tdap booster (no additional booster needed)');
      }
    } else {
      recommendation = 'Catch-up Tdap complete';
      seriesComplete = true;
      notes.push('Catch-up Tdap vaccination completed');
      
      if (currentAgeYears >= 7 && currentAgeYears <= 9) {
        notes.push('Still need adolescent Tdap booster at 11-12 years');
        seriesComplete = false;
      }
    }
  }
  
  // Special situations notes
  notes.push('Tdap may be given regardless of interval since last tetanus-containing vaccine');
  
  // Pregnancy note (for teens)
  if (currentAgeYears >= 13) {
    notes.push('During pregnancy: 1 dose Tdap each pregnancy (weeks 27-36)');
  }
  
  // Wound management note
  notes.push('For wound management: Tdap preferred if no previous Tdap or unknown history');
  
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
}