import { VaccineDoseInfo, addDays, getAgeInMonths, getAgeInYears, VaccineRecommendation } from '../vaccine-catchup.ts';
import { getVaccineRules, SpecialConditions } from '../vaccine-cdc-rules';

export function hibRecommendation(
  normalizedName: string,
  birthDate: Date,
  currentDate: Date,
  validDoses: VaccineDoseInfo[],
  numDoses: number,
  sortedDoses: VaccineDoseInfo[],
  specialConditions: SpecialConditions,
  immunityEvidence: any
): VaccineRecommendation {
  const hibRules = getVaccineRules(normalizedName);
  const currentAgeYears = getAgeInYears(birthDate, currentDate);
  const currentAgeMonths = getAgeInMonths(birthDate, currentDate);

  let recommendation = '';
  let nextDoseDate: string | undefined;
  let seriesComplete = false;
  const notes: string[] = [];
  if (currentAgeYears >= 5) {
    recommendation = 'HIB vaccine not routinely recommended after 5 years';
    seriesComplete = true;
    notes.push('HIB vaccine generally not needed for healthy children 5 years and older');
    if (specialConditions?.immunocompromised || specialConditions?.asplenia) {
      recommendation = 'Consider HIB vaccine for high-risk condition';
      seriesComplete = false;
      notes.push('May give 1 dose to older children/adults with asplenia or immunocompromised if unvaccinated');
    }
  } else {
    const ageAtFirst = numDoses > 0 ? getAgeInMonths(birthDate, validDoses[0].date) : currentAgeMonths;
    let ageKey: string;
    if (ageAtFirst < 7) ageKey = '<7m';
    else if (ageAtFirst < 12) ageKey = '7-11m';
    else if (ageAtFirst < 15) ageKey = '12-14m';
    else if (ageAtFirst < 60) ageKey = '15-59m';
    else ageKey = '15-59m';
    const catchUp = hibRules?.catchUpRules?.[ageKey] || { doses: 1, intervals: [] };
    const requiredDoses = catchUp.doses;
    if (numDoses >= requiredDoses) {
      recommendation = 'HIB series complete';
      seriesComplete = true;
      if (catchUp.notes?.length) notes.push(...catchUp.notes);
    } else if (numDoses === 0) {
      if (currentAgeMonths >= 1.5) {
        recommendation = 'Give HIB dose 1 now';
        if (catchUp.notes?.length) notes.push(...catchUp.notes);
      } else {
        const nextDate = addDays(birthDate, 42);
        recommendation = `Give HIB dose 1 on or after ${formatDate(nextDate)}`;
        nextDoseDate = formatDate(nextDate);
        notes.push('Minimum age: 6 weeks');
      }
    } else {
      const nextInterval = catchUp.intervals[numDoses - 1] || 28;
      const nextDate = addDays(validDoses[numDoses - 1].date, nextInterval);
      if (currentDate >= nextDate) {
        recommendation = `Give HIB dose ${numDoses + 1} now`;
      } else {
        recommendation = `Give HIB dose ${numDoses + 1} on or after ${formatDate(nextDate)}`;
        nextDoseDate = formatDate(nextDate);
      }
      if (catchUp.notes?.length) notes.push(...catchUp.notes);
      notes.push(`Minimum interval: ${nextInterval} days`);
    }
  }
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
}