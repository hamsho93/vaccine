import { addDays, getAgeInMonths, getAgeInYears, formatDate } from '../vaccine-catchup';
import { vaccineNameMapper } from '../vaccine-name-mapper';
export function dtapTdapRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, specialConditions, immunityEvidence) {
    const currentAgeYears = getAgeInYears(birthDate, currentDate);
    const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
    let recommendation = '';
    let nextDoseDate;
    let seriesComplete = false;
    const notes = [];
    // DTaP/Tdap logic based on CDC 2025 guidelines
    if (currentAgeYears >= 7) {
        // Tdap logic for 7+ years - need to handle both catch-up and booster scenarios
        const hasReceivedAdolescentBooster = validDoses.some(dose => {
            const doseAgeYears = getAgeInYears(birthDate, dose.date);
            return doseAgeYears >= 11; // Dose given at 11+ years counts as adolescent booster
        });
        if (numDoses < 3) {
            // Primary series incomplete
            recommendation = 'Give Tdap now as part of catch-up series';
            notes.push('Tdap preferred for first dose in catch-up series (age 7-18 years)');
            notes.push('If additional doses needed, use Td or Tdap');
            notes.push(`${3 - numDoses} more doses needed to complete primary series`);
            if (currentAgeYears >= 11 && !hasReceivedAdolescentBooster) {
                notes.push('This dose counts as adolescent Tdap booster');
            }
        }
        else if (numDoses >= 3) {
            // Primary series complete - check if adolescent booster needed
            if (currentAgeYears >= 11 && currentAgeYears <= 18 && !hasReceivedAdolescentBooster) {
                recommendation = 'Give Tdap adolescent booster now';
                notes.push('Adolescent Tdap booster dose at age 11-12 years');
                notes.push('Tdap may be given regardless of interval since last Td/DTaP');
            }
            else if (hasReceivedAdolescentBooster || currentAgeYears < 11) {
                recommendation = 'Tdap series complete';
                seriesComplete = true;
                notes.push('Primary tetanus-diphtheria-pertussis series complete');
                if (currentAgeYears < 11) {
                    notes.push('Adolescent Tdap booster due at 11-12 years');
                }
                else {
                    notes.push('Adolescent Tdap booster received');
                }
            }
            else {
                recommendation = 'Consider Tdap if no booster in past 10 years';
                seriesComplete = true;
                notes.push('Adult Tdap booster every 10 years or for wound management');
            }
        }
    }
    else {
        // DTaP logic for under 7 years - 5 dose series
        const dtapTotalDoses = 5;
        const requiredAges = [2, 4, 6, 15, 48]; // months for doses 1-5
        if (numDoses >= dtapTotalDoses) {
            recommendation = 'DTaP series complete';
            seriesComplete = true;
            notes.push('Five-dose DTaP series provides protection through childhood');
        }
        else if (numDoses === 4 && currentAgeMonths >= 48) {
            // 5th dose due at 4-6 years
            recommendation = 'Give DTaP dose 5 now (final childhood dose)';
            notes.push('Fifth dose completes childhood DTaP series');
            notes.push('Due at 4-6 years of age, minimum 6 months after dose 4');
        }
        else if (numDoses === 4 && currentAgeMonths < 48) {
            const nextDate = addDays(birthDate, 48 * 30.44); // 48 months
            recommendation = `Give DTaP dose 5 on or after ${formatDate(nextDate)}`;
            nextDoseDate = formatDate(nextDate);
            notes.push('Fifth dose due at 4-6 years of age');
        }
        else {
            const nextDoseNumber = numDoses + 1;
            recommendation = `Give DTaP dose ${nextDoseNumber}`;
            notes.push(`DTaP series: ${numDoses} of ${dtapTotalDoses} doses completed`);
            notes.push('Schedule: 2, 4, 6, 15-18 months, 4-6 years');
        }
    }
    // Use age-specific vaccine name (DTaP for <7 years, Tdap for 7+ years)
    const ageSpecificVaccineName = vaccineNameMapper.getAgeSpecificDisplay(normalizedName, currentAgeYears);
    return {
        vaccineName: ageSpecificVaccineName,
        recommendation,
        nextDoseDate,
        seriesComplete,
        notes
    };
}
