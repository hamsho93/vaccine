import { getAgeInYears } from '../vaccine-catchup';
export function choleraRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, specialConditions, immunityEvidence) {
    let seriesComplete = false;
    let recommendation = '';
    let nextDoseDate = undefined;
    const notes = [];
    const currentAgeYears = getAgeInYears(birthDate, currentDate);
    // Cholera is a travel vaccine for very specific high-risk situations
    recommendation = 'Cholera vaccination not routinely recommended for US residents or travelers';
    seriesComplete = true;
    notes.push('Cholera vaccine (Vaxchora) only recommended for:');
    notes.push('• Adults 18-64 years traveling to cholera-affected areas');
    notes.push('• Areas with active cholera transmission');
    notes.push('• Humanitarian workers in high-risk settings');
    notes.push('• Very limited travel situations with high exposure risk');
    notes.push('NOT recommended for routine travel or general precaution');
    // Age restrictions
    if (currentAgeYears < 18 || currentAgeYears > 64) {
        notes.push('⚠️ Vaccine only approved for ages 18-64 years');
        notes.push('Children and older adults: focus on food/water precautions');
    }
    // Important safety and efficacy information
    notes.push('Single oral dose provides moderate protection (up to 80%)');
    notes.push('Protection decreases over time (6 months+)');
    notes.push('Take at least 10 days before potential exposure');
    notes.push('Primary prevention: safe food and water practices');
    notes.push('Oral rehydration therapy is mainstay of cholera treatment');
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
