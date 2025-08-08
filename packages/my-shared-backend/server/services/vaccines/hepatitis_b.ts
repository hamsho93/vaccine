import { VaccineDoseInfo, addDays, formatDate, getAgeInMonths } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function hepatitisBRecommendation(
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
  const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
  if (immunityEvidence?.[normalizedName]) {
    seriesComplete = true;
    recommendation = 'Series complete due to evidence of immunity';
    notes.push('Immunity confirmed (e.g., lab results or disease history); no further doses needed per CDC');
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
  }
  if (numDoses >= 3) {
    recommendation = 'Hepatitis B series complete';
    seriesComplete = true;
  } else if (numDoses === 0) {
    if (currentAgeMonths >= 0) {
      recommendation = 'Give Hepatitis B dose 1 now (birth dose or catch-up)';
      notes.push('Hepatitis B should be given at birth or as soon as possible');
    }
  } else if (numDoses === 1) {
    const nextDate = addDays(sortedDoses[0].date, 28);
    if (currentDate >= nextDate) {
      recommendation = 'Give Hepatitis B dose 2 now';
    } else {
      recommendation = `Give Hepatitis B dose 2 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
    }
    notes.push('Minimum 4 weeks after dose 1');
  } else if (numDoses === 2) {
    const minFromDose2 = addDays(sortedDoses[1].date, 56);
    const minFromDose1 = addDays(sortedDoses[0].date, 112);
    const minAge = addDays(birthDate, 168);
    const nextDate = new Date(Math.max(minFromDose2.getTime(), minFromDose1.getTime(), minAge.getTime()));
    if (currentDate >= nextDate) {
      recommendation = 'Give Hepatitis B dose 3 now (final dose)';
    } else {
      recommendation = `Give Hepatitis B dose 3 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
    }
    notes.push('Final dose: minimum 8 weeks after dose 2, 16 weeks after dose 1, and at least 24 weeks of age');
  }
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
} 