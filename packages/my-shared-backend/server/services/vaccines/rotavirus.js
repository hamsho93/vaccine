import { getAgeInDays, getAgeInMonths, addDays, formatDate } from '../vaccine-catchup';
export function rotavirusRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, specialConditions, immunityEvidence) {
    let seriesComplete = false;
    let recommendation = '';
    let nextDoseDate = undefined;
    const notes = [];
    const currentAgeDays = getAgeInDays(birthDate, currentDate);
    const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
    // CDC 2025 Rotavirus guidelines - very age-specific restrictions
    const minAgeWeeks = 6; // 6 weeks minimum age
    const maxStartWeeks = 15; // Do not start series on or after 15 weeks
    const maxFinalAgeMonths = 8; // Maximum age for final dose is 8 months
    const minAgeDays = minAgeWeeks * 7;
    const maxStartDays = (maxStartWeeks * 7) - 1; // 14 weeks, 6 days
    const maxFinalAgeDays = maxFinalAgeMonths * 30.44;
    // Determine vaccine type and required doses FIRST
    let totalDoses = 2; // Default to Rotarix (2 doses)
    let vaccineType = 'Rotarix';
    // If any dose is RotaTeq or unknown, default to 3-dose series
    const hasRotaTeq = validDoses.some(dose => dose.product?.toLowerCase().includes('rotateq') ||
        dose.product?.toLowerCase().includes('rv5'));
    const hasUnknownProduct = validDoses.some(dose => !dose.product || dose.product === 'Unknown');
    if (hasRotaTeq || hasUnknownProduct) {
        totalDoses = 3;
        vaccineType = 'RotaTeq';
    }
    // Check series completion FIRST (before age checks)
    if (numDoses >= totalDoses) {
        recommendation = 'Rotavirus series complete';
        seriesComplete = true;
        notes.push(`${vaccineType} ${totalDoses}-dose series completed`);
        return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
    }
    // NOW check if too old for any additional rotavirus vaccination
    if (currentAgeDays > maxFinalAgeDays) {
        // Patient is too old - show as aged-out if they have any doses, otherwise exclude entirely
        if (numDoses > 0) {
            // Patient started series but aged out before completion
            return {
                vaccineName: normalizedName,
                recommendation: 'Rotavirus series cannot be completed - patient aged out',
                nextDoseDate: undefined,
                seriesComplete: false, // Series is incomplete but cannot be completed
                notes: [
                    `⏰ Patient aged out: Maximum age for final dose is 8 months, 0 days`,
                    `Started ${vaccineType} series: ${numDoses} of ${totalDoses} doses given`,
                    'CDC guidelines prohibit giving rotavirus vaccine after 8 months of age',
                    'Incomplete series still provides some protection',
                    'No further doses should be given at this age'
                ],
                decisionType: 'aged-out'
            };
        }
        else {
            // Patient never started series and is too old - exclude entirely
            return null;
        }
    }
    // Check if too young
    if (currentAgeDays < minAgeDays) {
        const nextDate = addDays(birthDate, minAgeDays);
        recommendation = `Rotavirus vaccination can begin on or after ${formatDate(nextDate)}`;
        nextDoseDate = formatDate(nextDate);
        notes.push('Minimum age: 6 weeks');
        notes.push('Rotarix: 2-dose series (2, 4 months)');
        notes.push('RotaTeq: 3-dose series (2, 4, 6 months)');
        return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
    }
    // Check if too old to START the series (but can continue if already started)
    if (numDoses === 0 && currentAgeDays > maxStartDays) {
        recommendation = 'Rotavirus vaccination not recommended - too old to start series';
        seriesComplete = true;
        notes.push('Do not start rotavirus series on or after 15 weeks, 0 days');
        notes.push('Series cannot be initiated at this age');
        return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
    }
    // Calculate next dose
    const nextDoseNumber = numDoses + 1;
    // Check intervals if we have previous doses
    if (numDoses > 0 && sortedDoses.length > 0) {
        const daysSinceLastDose = getAgeInDays(sortedDoses[0].date, currentDate);
        const minInterval = 28; // 4 weeks minimum interval
        if (daysSinceLastDose < minInterval) {
            const nextDate = addDays(sortedDoses[0].date, minInterval);
            recommendation = `Give rotavirus dose ${nextDoseNumber} on or after ${formatDate(nextDate)}`;
            nextDoseDate = formatDate(nextDate);
            notes.push(`Minimum interval: 4 weeks between doses`);
        }
        else {
            recommendation = `Give rotavirus dose ${nextDoseNumber} now`;
            nextDoseDate = formatDate(currentDate);
        }
    }
    else {
        // First dose
        recommendation = `Give rotavirus dose ${nextDoseNumber} now`;
        nextDoseDate = formatDate(currentDate);
    }
    // Add series-specific notes
    if (totalDoses === 2) {
        notes.push('Rotarix: 2-dose series (2, 4 months)');
    }
    else {
        notes.push('RotaTeq: 3-dose series (2, 4, 6 months)');
        notes.push('If any dose is RotaTeq or unknown, complete as 3-dose series');
    }
    notes.push(`Dose ${nextDoseNumber} of ${totalDoses}`);
    notes.push(`Maximum age for final dose: 8 months, 0 days`);
    return { vaccineName: normalizedName, recommendation, nextDoseDate, seriesComplete, notes };
}
