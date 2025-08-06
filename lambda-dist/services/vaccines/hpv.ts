import { VaccineDoseInfo, addDays, formatDate, getAgeInYears, VaccineRecommendation } from '../vaccine-catchup.ts';
import { SpecialConditions } from '../vaccine-cdc-rules';

export function hpvRecommendation(
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
  const hpvMinAge = 3285;
  const isOlderStart = currentAgeYears >= 15;
  const hpvTotalDoses = isOlderStart ? 3 : 2;
  if (currentAgeYears < 9) {
    recommendation = 'HPV vaccination not recommended under 9 years';
    seriesComplete = true;
    notes.push('Minimum age: 9 years');
    notes.push('Routine recommendation: 11-12 years');
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
  } else if (currentAgeYears > 26) {
    recommendation = 'Not routinely recommended after 26 years; discuss shared decision';
    notes.push('HPV vaccine most effective when given before exposure to HPV');
    notes.push('Adults 27-45 years: shared clinical decision-making with provider');
  } else if (numDoses >= hpvTotalDoses) {
    recommendation = 'HPV series complete';
    seriesComplete = true;
    notes.push('Provides protection against HPV types that cause most cancers and genital warts');
  } else if (numDoses === 0) {
    if (currentAgeYears >= 9) {
      recommendation = 'Give HPV dose 1 now';
      if (currentAgeYears < 15) {
        notes.push('2-dose schedule: Dose 1 → 5+ months → Dose 2');
      } else {
        notes.push('3-dose schedule (≥15 years): Dose 1 → 1-2 months → Dose 2 → 5 months → Dose 3');
      }
      if (currentAgeYears <= 12) {
        notes.push('Routine vaccination: 11-12 years (can start at 9 years)');
      } else {
        notes.push('Catch-up vaccination recommended through age 26');
      }
    } else {
      const nextDate = addDays(birthDate, hpvMinAge);
      recommendation = `Give HPV dose 1 on or after ${formatDate(nextDate)}`;
      nextDoseDate = formatDate(nextDate);
      notes.push('Minimum age: 9 years');
      notes.push('Routine vaccination: 11-12 years (can start at 9 years)');
    }
  } else if (numDoses === 1) {
    if (isOlderStart) {
      const nextDate = addDays(sortedDoses[0].date, 28);
      if (currentDate >= nextDate) {
        recommendation = 'Give HPV dose 2 now';
        notes.push('Next: Wait 6 months after dose 1 for dose 3 (final)');
      } else {
        recommendation = `Give HPV dose 2 on or after ${formatDate(nextDate)}`;
        nextDoseDate = formatDate(nextDate);
      }
      notes.push('3-dose schedule: minimum 1 month between doses 1-2');
    } else {
      const nextDate = addDays(sortedDoses[0].date, 150);
      if (currentDate >= nextDate) {
        recommendation = 'Give HPV dose 2 now (final dose)';
      } else {
        recommendation = `Give HPV dose 2 on or after ${formatDate(nextDate)} (final dose)`;
        nextDoseDate = formatDate(nextDate);
      }
      notes.push('2-dose schedule: minimum 5 months between doses');
    }
  } else if (numDoses === 2 && isOlderStart) {
    const fiveMonthsFromDose1 = addDays(sortedDoses[0].date, 150);
    const twelveWeeksFromDose2 = addDays(sortedDoses[1].date, 84);
    const nextDate = new Date(Math.max(fiveMonthsFromDose1.getTime(), twelveWeeksFromDose2.getTime()));
    if (currentDate >= nextDate) {
      recommendation = 'Give HPV dose 3 now (final dose)';
    } else {
      recommendation = `Give HPV dose 3 on or after ${formatDate(nextDate)} (final dose)`;
      nextDoseDate = formatDate(nextDate);
    }
    notes.push('Final dose: minimum 5 months after dose 1 AND 12 weeks after dose 2');
  }
  if (specialConditions?.immunocompromised) {
    // Adjust for 3 doses
  }
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
} 