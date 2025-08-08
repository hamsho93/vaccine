import { getAgeInYears } from '../vaccine-catchup';
export function japaneseEncephalitisRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, specialConditions, immunityEvidence) {
    let seriesComplete = false;
    let recommendation = '';
    let nextDoseDate = undefined;
    const notes = [];
    const currentAgeYears = getAgeInYears(birthDate, currentDate);
    // Japanese Encephalitis is a travel vaccine for specific endemic areas
    recommendation = 'Japanese Encephalitis vaccination not routinely recommended for US residents';
    seriesComplete = true;
    notes.push('Japanese Encephalitis vaccine (Ixiaro) is a travel vaccine for:');
    notes.push('• Long-term residents or frequent travelers to JE endemic areas in Asia');
    notes.push('• Laboratory workers with potential JE virus exposure');
    notes.push('• Outdoor activities in rural/agricultural areas during transmission season');
    notes.push('NOT recommended for short-term urban travel');
    // Age restrictions
    if (currentAgeYears < 2) {
        notes.push('Minimum age: 2 months for travel to endemic areas');
    }
    // Geographic areas
    notes.push('Endemic areas include: rural Asia, parts of Pacific islands');
    notes.push('Consult travel medicine specialist for individual risk assessment');
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
