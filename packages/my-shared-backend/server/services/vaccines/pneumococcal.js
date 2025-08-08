import { getAgeInDays, getAgeInMonths } from '../vaccine-catchup';
export function pneumococcalRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, specialConditions, immunityEvidence) {
    let seriesComplete = false;
    let recommendation = '';
    let nextDoseDate = undefined;
    const notes = [];
    // Pneumococcal vaccination logic based on CDC guidelines
    const currentAgeYears = Math.floor(getAgeInDays(birthDate, currentDate) / 365.25);
    const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
    // PCV series: 4 doses at 2, 4, 6, 12-15 months
    const pcvTotalDoses = 4;
    if (currentAgeYears >= 5) {
        // For healthy children 5+ years
        if (numDoses >= pcvTotalDoses) {
            recommendation = 'Pneumococcal (PCV) series complete';
            seriesComplete = true;
            notes.push('Four-dose PCV series provides protection for healthy children');
        }
        else {
            // Catch-up for healthy children 2-4 years with incomplete series
            if (currentAgeYears >= 2 && currentAgeYears <= 4) {
                recommendation = 'Give 1 dose PCV to complete catch-up';
                notes.push('Catch-up dose for incomplete childhood PCV series');
            }
            else {
                recommendation = 'PCV generally not needed for healthy children 5+ years';
                seriesComplete = true;
                notes.push('Consult provider if high-risk conditions present');
            }
        }
    }
    else if (currentAgeMonths >= 24) {
        // Ages 2-4 years
        if (numDoses >= pcvTotalDoses) {
            recommendation = 'Pneumococcal (PCV) series complete';
            seriesComplete = true;
        }
        else {
            recommendation = 'Give 1 dose PCV to complete series';
            notes.push('Catch-up vaccination for children ages 2-4 years');
            notes.push('One dose needed if incomplete series');
        }
    }
    else {
        // Under 2 years - continue routine series
        if (numDoses >= pcvTotalDoses) {
            recommendation = 'Pneumococcal (PCV) series complete';
            seriesComplete = true;
        }
        else {
            const nextDoseNumber = numDoses + 1;
            recommendation = `Give PCV dose ${nextDoseNumber}`;
            notes.push('PCV series: 2, 4, 6, 12-15 months');
        }
    }
    // Check for high-risk conditions that require additional vaccination
    if (specialConditions?.immunocompromised ||
        specialConditions?.asplenia ||
        specialConditions?.cochlearImplant ||
        specialConditions?.csfLeak ||
        specialConditions?.hivInfection) {
        notes.push('High-risk conditions may require additional pneumococcal vaccination');
        notes.push('Consult provider for PPSV23 recommendations');
    }
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
}
