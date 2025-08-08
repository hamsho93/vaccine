import { getAgeInYears } from '../vaccine-catchup';
export function dengueRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, specialConditions, immunityEvidence) {
    let seriesComplete = false;
    let recommendation = '';
    let nextDoseDate = undefined;
    const notes = [];
    const currentAgeYears = getAgeInYears(birthDate, currentDate);
    // Geographic restriction - Dengue vaccine only for specific endemic areas
    // Based on CDC 2021 ACIP recommendations: Puerto Rico, American Samoa, U.S. Virgin Islands,
    // Federated States of Micronesia, Republic of Marshall Islands, Republic of Palau
    recommendation = 'Dengue vaccination not recommended for US-based patients';
    seriesComplete = true;
    notes.push('Dengue vaccine (Dengvaxia) only recommended for endemic areas:');
    notes.push('• Puerto Rico, American Samoa, U.S. Virgin Islands');
    notes.push('• Federated States of Micronesia, Marshall Islands, Palau');
    notes.push('NOT recommended for US mainland residents or travelers');
    notes.push('Requires laboratory-confirmed previous dengue infection');
    // Age restriction
    if (currentAgeYears < 9 || currentAgeYears > 16) {
        notes.push('Age restriction: Only approved for ages 9-16 years in endemic areas');
    }
    // Important safety information
    notes.push('⚠️ Can increase severe dengue risk if no previous infection');
    notes.push('Requires pre-vaccination screening for previous dengue exposure');
    return {
        vaccineName: normalizedName,
        recommendation,
        nextDoseDate,
        seriesComplete,
        notes,
        decisionType: 'international-advisory',
        contraindications: [],
        precautions: [],
        specialSituations: []
    };
}
