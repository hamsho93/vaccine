import { VaccineDoseInfo, addDays, formatDate, getAgeInDays, getAgeInMonths } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { getVaccineRules, SpecialConditions } from '../vaccine-cdc-rules';

export function pneumococcalRecommendation(
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
  const nextDoseDate: string | undefined = undefined;
  const notes: string[] = [];
  // Pneumococcal vaccination logic based on CDC guidelines
  const currentAgeYears = Math.floor(getAgeInDays(birthDate, currentDate) / 365.25);
  const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
  
  // PCV series: 4 doses at 2, 4, 6, 12-15 months (PCV13/15)
  // CDC 2025: PCV20 is an option; for catch-up, a single PCV20 dose may complete series in certain ages.
  const pcvTotalDoses = 4;

  const anyPCV20 = validDoses.some(d => (d.product || '').toLowerCase().includes('pcv20'));
  const anyPCV15 = validDoses.some(d => (d.product || '').toLowerCase().includes('pcv15'));
  
  if (currentAgeYears >= 5) {
    // For healthy children 5+ years
    if (numDoses >= pcvTotalDoses) {
      recommendation = 'Pneumococcal (PCV) series complete';
      seriesComplete = true;
      notes.push('Four-dose PCV series provides protection for healthy children');
    } else {
      // Catch-up for healthy children 2-4 years with incomplete series
      if (currentAgeYears >= 2 && currentAgeYears <= 4) {
        // If incomplete series, 1 dose PCV20 can complete catch-up
        recommendation = 'Give 1 dose PCV (prefer PCV20) to complete catch-up';
        notes.push('PCV20: single dose catch-up for ages 2–4 with incomplete series');
        notes.push('If PCV20 unavailable, give 1 dose PCV15');
      } else {
        recommendation = 'PCV generally not needed for healthy children 5+ years';
        seriesComplete = true;
        notes.push('Consult provider if high-risk conditions present');
      }
    }
  } else if (currentAgeMonths >= 24) {
    // Ages 2-4 years
    if (numDoses >= pcvTotalDoses) {
      recommendation = 'Pneumococcal (PCV) series complete';
      seriesComplete = true;
    } else {
      recommendation = 'Give 1 dose PCV (prefer PCV20) to complete series';
      notes.push('Catch-up vaccination for ages 2–4 years: single dose');
      notes.push('PCV20 preferred when available');
    }
  } else {
    // Under 2 years - continue routine series
    if (numDoses >= pcvTotalDoses) {
      recommendation = 'Pneumococcal (PCV) series complete';
      seriesComplete = true;
    } else {
      const nextDoseNumber = numDoses + 1;
      recommendation = `Give PCV dose ${nextDoseNumber}`;
      notes.push('PCV series: 2, 4, 6, 12-15 months');
    }
  }
  
  // Check for high-risk conditions that require additional vaccination
  if (
    specialConditions?.immunocompromised ||
    specialConditions?.asplenia ||
    specialConditions?.cochlearImplant ||
    specialConditions?.csfLeak ||
    specialConditions?.hivInfection
  ) {
    notes.push('High-risk: additional pneumococcal vaccination may be indicated');
    if (anyPCV20) {
      notes.push('If PCV20 given, PPSV23 generally not needed');
    } else {
      notes.push('If only PCV15/13 given, PPSV23 may be recommended');
    }
  }
  
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
} 