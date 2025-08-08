import { VaccineDoseInfo, addDays, formatDate, getAgeInDays } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';

export function ipvRecommendation(
  normalizedName: string, 
  birthDate: Date, 
  currentDate: Date, 
  validDoses: VaccineDoseInfo[], 
  numDoses: number, 
  sortedDoses: VaccineDoseInfo[],
  specialConditions?: any,
  immunityEvidence?: any
): VaccineRecommendation {
  let seriesComplete = false;
  let recommendation = '';
  let nextDoseDate: string | undefined = undefined;
  const notes: string[] = [];
  const ipvTotalDoses = 4;
  const ipvMinAge = 42;
  const currentAgeDays = getAgeInDays(birthDate, currentDate);
  if (numDoses >= ipvTotalDoses) {
    recommendation = 'Polio (IPV) series complete';
    seriesComplete = true;
    notes.push('Four doses provide lifelong protection against polio');
  } else if (numDoses === 0) {
    if (currentAgeDays >= ipvMinAge) {
      recommendation = 'Give polio (IPV) dose 1 now';
      notes.push('Schedule: 2, 4, 6-18 months, 4-6 years');
      notes.push('Minimum age: 6 weeks');
    } else {
      const nextDate = addDays(birthDate, ipvMinAge);
      recommendation = `Give polio (IPV) dose 1 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
      notes.push('Minimum age: 6 weeks');
    }
  } else if (numDoses === 1) {
    const nextDate = addDays(sortedDoses[0].date, 28);
    if (currentDate >= nextDate) {
      recommendation = 'Give polio (IPV) dose 2 now';
    } else {
      recommendation = `Give polio (IPV) dose 2 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
    }
    notes.push('Minimum interval: 4 weeks between doses 1-2');
  } else if (numDoses === 2) {
    const nextDate = addDays(sortedDoses[1].date, 28);
    if (currentDate >= nextDate) {
      recommendation = 'Give polio (IPV) dose 3 now';
    } else {
      recommendation = `Give polio (IPV) dose 3 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
    }
    notes.push('Minimum interval: 4 weeks between doses 2-3');
  } else if (numDoses === 3) {
    const ageDate = addDays(birthDate, 4 * 365);
    const intervalDate = addDays(sortedDoses[2].date, 183);
    const nextDate = new Date(Math.max(ageDate.getTime(), intervalDate.getTime()));
    if (currentDate >= nextDate) {
      recommendation = 'Give polio (IPV) dose 4 now (final dose)';
    } else {
      recommendation = `Give polio (IPV) dose 4 on or after ${formatDate(nextDate)} (final dose)`;
      nextDoseDate = formatDate(nextDate);
    }
    notes.push('Final dose: must be given at age 4+ years AND 6 months after dose 3');
  }
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
}