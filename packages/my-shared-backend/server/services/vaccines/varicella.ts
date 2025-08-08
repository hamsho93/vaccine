import { VaccineDoseInfo, addDays, formatDate, getAgeInDays, getAgeInYears } from '../vaccine-catchup';
import type { VaccineRecommendation } from '@shared/schema';
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
  const getVaricellaInterval = () => {
    if (currentAgeYears >= 13) {
      return 28; // 4-8 weeks for ages 13+, minimum 4 weeks
    } else if (currentAgeYears >= 7) {
      return 84; // 3 months routine for ages 7-12, minimum 4 weeks
    } else {
      return 84; // 3 months routine for ages 1-6, minimum 4 weeks
    }
  };
  const varInterval = getVaricellaInterval();
  if (numDoses >= varTotalDoses) {
    recommendation = 'Varicella series complete';
    seriesComplete = true;
    notes.push('Two doses provide excellent protection against chickenpox');
  } else if (numDoses === 0) {
    if (currentAgeDays >= varMinAge) {
      recommendation = 'Give varicella dose 1 now';
      if (currentAgeYears < 13) {
        notes.push('Schedule: Dose 1 → 3 months minimum → Dose 2');
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
    const intervalText = currentAgeYears < 13 ? '3 months' : '4 weeks';
    notes.push(`Minimum interval: ${intervalText} between doses`);
  }
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
} 