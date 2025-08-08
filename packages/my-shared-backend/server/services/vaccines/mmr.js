import { addDays, formatDate, getAgeInDays, getAgeInYears } from '../vaccine-catchup';
export function mmrRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, specialConditions, immunityEvidence) {
    let seriesComplete = false;
    let recommendation = '';
    let nextDoseDate = undefined;
    const notes = [];
    const mmrTotalDoses = 2;
    const mmrMinAge = 365;
    const mmrInterval = 28;
    const currentAgeDays = getAgeInDays(birthDate, currentDate);
    const currentAgeYears = getAgeInYears(birthDate, currentDate);
    if (numDoses >= mmrTotalDoses) {
        recommendation = 'MMR series complete';
        seriesComplete = true;
        notes.push('Two doses provide lifelong protection');
    }
    else if (numDoses === 0) {
        if (currentAgeDays >= mmrMinAge) {
            recommendation = 'Give MMR dose 1 now';
            notes.push('Schedule: Dose 1 at 12-15 months → 4 weeks → Dose 2 at 4-6 years');
        }
        else {
            const nextDate = addDays(birthDate, mmrMinAge);
            recommendation = `Give MMR dose 1 on or after ${formatDate(nextDate)}`;
            nextDoseDate = formatDate(nextDate);
            notes.push('Minimum age: 12 months');
        }
        if (currentAgeYears <= 6) {
            notes.push('Routine schedule: 12-15 months and 4-6 years');
        }
        else {
            notes.push('Catch-up vaccination for missed MMR doses');
        }
    }
    else {
        const nextDate = addDays(sortedDoses[0].date, mmrInterval);
        if (currentDate >= nextDate) {
            recommendation = 'Give MMR dose 2 now (final dose)';
        }
        else {
            recommendation = `Give MMR dose 2 on or after ${formatDate(nextDate)} (final dose)`;
            nextDoseDate = formatDate(nextDate);
        }
        notes.push('Minimum interval: 4 weeks between doses');
    }
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
}
