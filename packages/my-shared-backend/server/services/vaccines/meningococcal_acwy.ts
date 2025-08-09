import { VaccineDoseInfo, getAgeInYears, getAgeInDays, addDays, formatDate } from '../vaccine-catchup';
import type { VaccineRecommendation } from '../../../shared/schema';
import { getVaccineRules, SpecialConditions } from '../vaccine-cdc-rules';

export function meningococcalACWYRecommendation(
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
  
  // CDC 2025 MenACWY guidelines
  const minAge = 2; // months for high-risk, years for routine
  const routineAge1 = 11; // First routine dose
  const routineAge2 = 16; // Booster dose
  const isHighRisk = specialConditions?.immunocompromised || 
                     specialConditions?.asplenia;
  
  // Age-based recommendations
  if (currentAgeYears < 2 && !isHighRisk) {
    recommendation = 'MenACWY not routinely recommended under 2 years';
    seriesComplete = true;
    notes.push('Routine vaccination begins at 11-12 years');
    notes.push('May be given earlier for high-risk conditions');
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
  }
  
  // High-risk children (any age ≥2 months)
  if (isHighRisk && currentAgeYears >= 0) {
    if (currentAgeYears < 2) {
      // Infants/toddlers with high-risk conditions
      recommendation = 'MenACWY recommended for high-risk conditions - consult provider';
      notes.push('High-risk conditions: immunodeficiency, asplenia, complement deficiency');
      notes.push('Age-specific dosing schedule for high-risk infants');
    } else {
      // High-risk children ≥2 years
      if (numDoses === 0) {
        recommendation = 'Give MenACWY now (high-risk)';
        nextDoseDate = formatDate(currentDate);
        notes.push('High-risk conditions require earlier vaccination');
      } else if (numDoses === 1 && currentAgeYears < 7) {
        recommendation = 'Give MenACWY dose 2 now';
        nextDoseDate = formatDate(currentDate);
        notes.push('High-risk children need 2-dose primary series');
      } else {
        recommendation = 'MenACWY series complete for high-risk';
        seriesComplete = true;
        notes.push('High-risk individuals may need boosters every 3-5 years');
      }
    }
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
  }
  
  // Routine vaccination schedule for healthy children
  if (currentAgeYears >= 11 && currentAgeYears <= 12) {
    // First routine dose age
    if (numDoses === 0) {
      recommendation = 'Give MenACWY dose 1 now (routine)';
      nextDoseDate = formatDate(currentDate);
      notes.push('Routine first dose at 11-12 years');
      notes.push('Booster dose needed at 16 years');
    } else if (numDoses === 1) {
      recommendation = 'MenACWY first dose complete, booster due at 16 years';
      seriesComplete = false;
      notes.push('Booster dose scheduled at age 16');
    } else {
      recommendation = 'MenACWY series complete';
      seriesComplete = true;
    }
  } else if (currentAgeYears >= 13 && currentAgeYears <= 15) {
    // Catch-up first dose
    if (numDoses === 0) {
      recommendation = 'Give MenACWY dose 1 now (catch-up)';
      nextDoseDate = formatDate(currentDate);
      notes.push('Catch-up vaccination for missed first dose');
      notes.push('Booster dose needed at 16 years');
    } else if (numDoses === 1) {
      recommendation = 'MenACWY first dose complete, booster due at 16 years';
      seriesComplete = false;
      notes.push('Booster dose scheduled at age 16');
    } else {
      recommendation = 'MenACWY series complete';
      seriesComplete = true;
    }
  } else if (currentAgeYears >= 16 && currentAgeYears <= 18) {
    // Booster age or catch-up
    if (numDoses === 0) {
      recommendation = 'Give MenACWY dose 1 now';
      nextDoseDate = formatDate(currentDate);
      notes.push('Starting series at 16+ years requires only 1 dose');
      notes.push('CDC guidelines: Single dose sufficient when starting at age 16 or older');
    } else if (numDoses === 1) {
      // Check if it was given at appropriate age for booster
      const lastDoseAge = sortedDoses.length > 0 ? getAgeInYears(birthDate, sortedDoses[0].date) : 0;
      
      if (lastDoseAge >= 11 && lastDoseAge <= 15) {
        // Ensure minimum interval of 8 weeks from prior dose
        const minBoosterDate = addDays(sortedDoses[0].date, 56);
        if (currentDate >= minBoosterDate) {
          recommendation = 'Give MenACWY booster dose now';
          nextDoseDate = formatDate(currentDate);
        } else {
          recommendation = `Give MenACWY booster dose on or after ${formatDate(minBoosterDate)}`;
          nextDoseDate = formatDate(minBoosterDate);
        }
        notes.push('Booster dose at 16 years for dose given at 11-15 years');
        notes.push('Minimum interval: 8 weeks after previous MenACWY dose');
      } else {
        // Single dose given at 16+ is complete
        recommendation = 'MenACWY series complete';
        seriesComplete = true;
        notes.push('Single dose sufficient when started at age 16 or older');
      }
    } else {
      recommendation = 'MenACWY series complete';
      seriesComplete = true;
    }
  } else if (currentAgeYears >= 19 && currentAgeYears <= 21) {
    // College freshman and catch-up through age 21 if no dose at >=16
    const hadDoseAt16OrOlder = sortedDoses.some(d => getAgeInYears(birthDate, d.date) >= 16);
    if (!hadDoseAt16OrOlder) {
      recommendation = 'Give 1 dose MenACWY now (age 19–21 without a dose at age 16 or older)';
      nextDoseDate = formatDate(currentDate);
      seriesComplete = false;
      notes.push('First-year college students living in residence halls should receive 1 dose if not vaccinated at age 16 or older');
      notes.push('Single catch-up dose recommended through age 21 if no dose at 16+');
    } else {
      recommendation = 'MenACWY series complete';
      seriesComplete = true;
    }
  } else if (currentAgeYears >= 2 && currentAgeYears <= 10) {
    // Not routinely recommended for healthy children 2-10 years
    recommendation = 'MenACWY not routinely recommended for healthy children 2-10 years';
    seriesComplete = true;
    notes.push('Routine vaccination begins at 11-12 years');
    notes.push('May be given earlier for high-risk conditions or travel');
  }
  
  // Travel and outbreak notes
  notes.push('May be recommended for travel to endemic areas');
  notes.push('Additional doses may be needed during outbreaks');
  if (isHighRisk) {
    notes.push('For persistent risk: boosters every 5 years if vaccinated at age ≥7 years; every 3 years if primary series completed before age 7');
  }
  
  return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
}