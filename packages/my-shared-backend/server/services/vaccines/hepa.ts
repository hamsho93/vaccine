import { addDays, formatDate, getAgeInDays, VaccineDoseInfo } from '../vaccine-catchup';
import type { VaccineRecommendation } from '@shared/schema';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function hepaRecommendation(
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
  const currentAgeDays = getAgeInDays(birthDate, currentDate);
  const hepATotalDoses = 2;
  const hepAMinAge = 365;
  const hepAInterval = 180;
  if (numDoses >= hepATotalDoses) {
    recommendation = 'Hepatitis A series complete';
    seriesComplete = true;
    notes.push('Two doses provide long-term protection');
  } else if (numDoses === 0) {
    if (currentAgeDays >= hepAMinAge) {
      recommendation = 'Give Hepatitis A dose 1 now';
      nextDoseDate = formatDate(currentDate);
      notes.push('Hepatitis A recommended for all children ≥12 months');
      notes.push('Catch-up vaccination through age 18 years');
    } else {
      const nextDate = addDays(birthDate, hepAMinAge);
      recommendation = `Give Hepatitis A dose 1 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
      notes.push('Minimum age: 12 months');
    }
  } else {
    const daysSinceLast = getAgeInDays(sortedDoses[0].date, currentDate);
    if (daysSinceLast >= hepAInterval) {
      recommendation = 'Give Hepatitis A dose 2 now (final dose)';
      nextDoseDate = formatDate(currentDate);
    } else {
      const nextDate = addDays(sortedDoses[0].date, hepAInterval);
      recommendation = `Give Hepatitis A dose 2 on or after ${formatDate(nextDate)} (final dose)`;
      nextDoseDate = formatDate(nextDate);
    }
    notes.push('Minimum interval: 6 months between doses');
  }
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
} 