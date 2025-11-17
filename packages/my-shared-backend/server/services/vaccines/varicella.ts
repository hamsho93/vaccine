import { VaccineDoseInfo, addDays, formatDate, getAgeInDays, getAgeInYears } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { getVaccineRules, SpecialConditions } from '../vaccine-cdc-rules';

export function varicellaRecommendation(
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
  const varicellaRules = getVaccineRules('varicella');
  const varTotalDoses = 2;
  const varMinAge = 365;
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  const currentAgeDays = getAgeInDays(birthDate, currentDate);
  // CDC 2025 Varicella intervals
  // Note: Dose 2 may be administered as early as 3 months after dose 1
  // A dose inadvertently administered after at least 4 weeks may be counted as valid
  const getVaricellaInterval = () => {
    if (currentAgeYears >= 13) {
      return 28; // 4-8 weeks for ages 13+, minimum 4 weeks
    } else if (currentAgeYears >= 7) {
      return 28; // Minimum 4 weeks for ages 7-12 (routine 3 months, but 4 weeks valid)
    } else {
      return 28; // Minimum 4 weeks for ages 1-6 (routine 3 months, but 4 weeks valid)
    }
  };
  const varInterval = getVaricellaInterval();
  
  // MMRV note: MMRV not recommended for ages 12-47 months or ages 13-18 years
  if (currentAgeYears >= 1 && currentAgeYears < 4) {
    notes.push('MMRV not recommended for ages 12-47 months (administer MMR and varicella separately)');
  } else if (currentAgeYears >= 13) {
    notes.push('MMRV not recommended for ages 13-18 years (administer MMR and varicella separately)');
  }
  
  if (numDoses >= varTotalDoses) {
    recommendation = 'Varicella series complete';
    seriesComplete = true;
    notes.push('Two doses provide excellent protection against chickenpox');
  } else if (numDoses === 0) {
    if (currentAgeDays >= varMinAge) {
      recommendation = 'Give varicella dose 1 now';
      if (currentAgeYears < 13) {
        notes.push('Schedule: Dose 1 → 3 months routine (4 weeks minimum valid) → Dose 2');
      } else {
        notes.push('Schedule: Dose 1 → 4 weeks minimum → Dose 2');
      }
    } else {
      const nextDate = addDays(birthDate, varMinAge);
      recommendation = `Give varicella dose 1 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
      notes.push('Minimum age: 12 months');
    }
    if (currentAgeYears <= 6) {
      notes.push('Routine schedule: 12-15 months and 4-6 years');
    } else {
      notes.push('Catch-up vaccination for missed varicella doses');
    }
  } else {
    const nextDate = addDays(sortedDoses[0].date, varInterval);
    if (currentDate >= nextDate) {
      recommendation = 'Give varicella dose 2 now (final dose)';
    } else {
      recommendation = `Give varicella dose 2 on or after ${formatDate(nextDate)} (final dose)`;
      nextDoseDate = formatDate(nextDate);
    }
    // Clarify that 4 weeks minimum is valid (not just 3 months)
    if (currentAgeYears < 13) {
      notes.push('Minimum interval: 4 weeks between doses (routine interval is 3 months, but 4 weeks is valid)');
    } else {
      notes.push('Minimum interval: 4 weeks between doses');
    }
  }
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
} 