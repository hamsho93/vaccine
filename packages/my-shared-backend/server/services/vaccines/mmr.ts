import { VaccineDoseInfo, addDays, formatDate, getAgeInDays, getAgeInYears } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function mmrRecommendation(
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
  const mmrTotalDoses = 2;
  const mmrMinAge = 365;
  const mmrInterval = 28;
  const currentAgeDays = getAgeInDays(birthDate, currentDate);
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  
  // MMRV note: MMRV not recommended for ages 12-47 months or ages 13-18 years
  if (currentAgeYears >= 1 && currentAgeYears < 4) {
    notes.push('MMRV not recommended for ages 12-47 months (administer MMR and varicella separately)');
  } else if (currentAgeYears >= 13) {
    notes.push('MMRV not recommended for ages 13-18 years (administer MMR and varicella separately)');
  }
  
  if (numDoses >= mmrTotalDoses) {
    recommendation = 'MMR series complete';
    seriesComplete = true;
    notes.push('Two doses provide lifelong protection');
  } else if (numDoses === 0) {
    if (currentAgeDays >= mmrMinAge) {
      recommendation = 'Give MMR dose 1 now';
      notes.push('Schedule: Dose 1 at 12-15 months → 4 weeks → Dose 2 at 4-6 years');
    } else {
      const nextDate = addDays(birthDate, mmrMinAge);
      recommendation = `Give MMR dose 1 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
      notes.push('Minimum age: 12 months');
    }
    if (currentAgeYears <= 6) {
      notes.push('Routine schedule: 12-15 months and 4-6 years');
    } else {
      notes.push('Catch-up vaccination for missed MMR doses');
    }
  } else {
    const nextDate = addDays(sortedDoses[0].date, mmrInterval);
    if (currentDate >= nextDate) {
      recommendation = 'Give MMR dose 2 now (final dose)';
    } else {
      recommendation = `Give MMR dose 2 on or after ${formatDate(nextDate)} (final dose)`;
      nextDoseDate = formatDate(nextDate);
    }
    notes.push('Minimum interval: 4 weeks between doses');
  }
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
} 