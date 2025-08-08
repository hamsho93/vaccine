import { vaccineNameMapper } from "./vaccine-name-mapper";
import { getVaccineRules } from "./vaccine-cdc-rules";
import { hepatitisBRecommendation } from './vaccines/hepatitis_b';
import { rotavirusRecommendation } from './vaccines/rotavirus';
import { dtapTdapRecommendation } from './vaccines/dtap_tdap';
import { hibRecommendation } from './vaccines/hib';
import { pneumococcalRecommendation } from './vaccines/pneumococcal';
import { ipvRecommendation } from './vaccines/ipv';
import { mmrRecommendation } from './vaccines/mmr';
import { varicellaRecommendation } from './vaccines/varicella';
import { hepaRecommendation } from './vaccines/hepa';
import { tdapRecommendation } from './vaccines/tdap';
import { hpvRecommendation } from './vaccines/hpv';
import { meningococcalACWYRecommendation } from './vaccines/meningococcal_acwy';
import { meningococcalBRecommendation } from './vaccines/meningococcal_b';
import { covid19Recommendation } from './vaccines/covid19';
import { influenzaRecommendation } from './vaccines/influenza';
import { dengueRecommendation } from './vaccines/dengue';
import { rsvRecommendation } from './vaccines/rsv';
import { japaneseEncephalitisRecommendation } from './vaccines/japanese_encephalitis';
import { yellowFeverRecommendation } from './vaccines/yellow_fever';
import { typhoidRecommendation } from './vaccines/typhoid';
import { choleraRecommendation } from './vaccines/cholera';
// Vaccine name normalization is now handled by the centralized vaccine-name-mapper
export function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}
export function formatDate(date) {
    return date.toISOString().split('T')[0];
}
export function getAgeInDays(birthDate, currentDate) {
    return Math.floor((currentDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
}
export function getAgeInMonths(birthDate, currentDate) {
    const ageInDays = getAgeInDays(birthDate, currentDate);
    return Math.floor(ageInDays / 30.44);
}
export function getAgeInYears(birthDate, currentDate) {
    const ageInDays = getAgeInDays(birthDate, currentDate);
    return Math.floor(ageInDays / 365.25);
}
export function isDoseTooEarly(vaccineName, doseNumber, birthDate, doseDate, previousDoseDate) {
    const rules = getVaccineRules(vaccineName);
    if (!rules)
        return false;
    const GRACE_PERIOD_DAYS = 4;
    // Check minimum age for first dose
    if (doseNumber === 1) {
        const ageAtDose = getAgeInDays(birthDate, doseDate);
        const daysDiff = rules.minimumAge - ageAtDose;
        return daysDiff > GRACE_PERIOD_DAYS;
    }
    // Check minimum interval from previous dose
    if (previousDoseDate && doseNumber > 1) {
        const daysBetween = getAgeInDays(previousDoseDate, doseDate);
        const requiredInterval = Array.isArray(rules.minimumIntervals)
            ? rules.minimumIntervals[doseNumber - 2] || 28
            : 28;
        const daysDiff = requiredInterval - daysBetween;
        return daysDiff > GRACE_PERIOD_DAYS;
    }
    return false;
}
export class VaccineCatchUpService {
    parseDate(dateStr) {
        return new Date(dateStr);
    }
    calculateAge(birthDate, currentDate) {
        const ageInDays = getAgeInDays(birthDate, currentDate);
        const years = Math.floor(ageInDays / 365);
        const months = Math.floor((ageInDays % 365) / 30);
        if (years > 0) {
            return `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
        }
        else {
            return `${months} month${months > 1 ? 's' : ''}`;
        }
    }
    // Normalize vaccine name using the centralized mapper
    normalizeVaccineName(name) {
        return vaccineNameMapper.toInternal(name);
    }
    // Get age in months for easier calculations
    getAgeInMonths(birthDate, currentDate) {
        const ageInDays = getAgeInDays(birthDate, currentDate);
        return Math.floor(ageInDays / 30.44); // More accurate month calculation
    }
    // Get age in years
    getAgeInYears(birthDate, currentDate) {
        const ageInDays = getAgeInDays(birthDate, currentDate);
        return Math.floor(ageInDays / 365.25); // Account for leap years
    }
    // Helper function to determine if a completed vaccine series followed normal or catch-up schedule
    getScheduleStatus(normalizedName, birthDate, validDoses, currentAgeYears) {
        if (validDoses.length === 0)
            return 'unknown';
        // Define normal schedule windows for common vaccines
        const normalSchedules = {
            'hepatitis_b': [
                { dose: 1, minAgeMonths: 0, maxAgeMonths: 1 }, // Birth dose
                { dose: 2, minAgeMonths: 1, maxAgeMonths: 4 }, // 1-2 months
                { dose: 3, minAgeMonths: 6, maxAgeMonths: 18 } // 6-18 months
            ],
            'dtap_tdap': [
                { dose: 1, minAgeMonths: 2, maxAgeMonths: 4 }, // 2 months
                { dose: 2, minAgeMonths: 4, maxAgeMonths: 6 }, // 4 months
                { dose: 3, minAgeMonths: 6, maxAgeMonths: 8 }, // 6 months
                { dose: 4, minAgeMonths: 15, maxAgeMonths: 18 }, // 15-18 months
                { dose: 5, minAgeMonths: 48, maxAgeMonths: 72 } // 4-6 years
            ],
            'pneumococcal': [
                { dose: 1, minAgeMonths: 2, maxAgeMonths: 4 }, // 2 months
                { dose: 2, minAgeMonths: 4, maxAgeMonths: 6 }, // 4 months
                { dose: 3, minAgeMonths: 6, maxAgeMonths: 8 }, // 6 months
                { dose: 4, minAgeMonths: 12, maxAgeMonths: 15 } // 12-15 months
            ],
            'hib': [
                { dose: 1, minAgeMonths: 2, maxAgeMonths: 4 }, // 2 months
                { dose: 2, minAgeMonths: 4, maxAgeMonths: 6 }, // 4 months
                { dose: 3, minAgeMonths: 6, maxAgeMonths: 8 }, // 6 months (if needed)
                { dose: 4, minAgeMonths: 12, maxAgeMonths: 15 } // 12-15 months
            ],
            'ipv': [
                { dose: 1, minAgeMonths: 2, maxAgeMonths: 4 }, // 2 months
                { dose: 2, minAgeMonths: 4, maxAgeMonths: 6 }, // 4 months
                { dose: 3, minAgeMonths: 6, maxAgeMonths: 18 }, // 6-18 months
                { dose: 4, minAgeMonths: 48, maxAgeMonths: 72 } // 4-6 years
            ],
            'mmr': [
                { dose: 1, minAgeMonths: 12, maxAgeMonths: 15 }, // 12-15 months
                { dose: 2, minAgeMonths: 48, maxAgeMonths: 72 } // 4-6 years
            ],
            'varicella': [
                { dose: 1, minAgeMonths: 12, maxAgeMonths: 15 }, // 12-15 months
                { dose: 2, minAgeMonths: 48, maxAgeMonths: 72 } // 4-6 years
            ],
            'hepatitis_a': [
                { dose: 1, minAgeMonths: 12, maxAgeMonths: 23 }, // 12-23 months
                { dose: 2, minAgeMonths: 18, maxAgeMonths: 35 } // 6 months after dose 1
            ]
        };
        const schedule = normalSchedules[normalizedName];
        if (!schedule)
            return 'unknown';
        // Check if doses were given within normal schedule windows
        let onSchedule = true;
        for (let i = 0; i < validDoses.length && i < schedule.length; i++) {
            const dose = validDoses[i];
            const expectedWindow = schedule[i];
            const ageAtDoseMonths = this.getAgeInMonths(birthDate, dose.date);
            if (ageAtDoseMonths < expectedWindow.minAgeMonths || ageAtDoseMonths > expectedWindow.maxAgeMonths) {
                onSchedule = false;
                break;
            }
        }
        // Special considerations for catch-up
        // If first dose was given significantly late, it's catch-up
        if (validDoses.length > 0 && schedule.length > 0) {
            const firstDoseAgeMonths = this.getAgeInMonths(birthDate, validDoses[0].date);
            const expectedFirstDoseMax = schedule[0].maxAgeMonths;
            // If first dose was more than 6 months late, consider it catch-up
            if (firstDoseAgeMonths > expectedFirstDoseMax + 6) {
                return 'catch-up-schedule';
            }
        }
        return onSchedule ? 'normal-schedule' : 'catch-up-schedule';
    }
    // Check if dose was given too early according to CDC guidelines
    isDoseTooEarly(vaccineName, doseNumber, birthDate, doseDate, previousDoseDate) {
        const rules = getVaccineRules(vaccineName);
        if (!rules)
            return false;
        const GRACE_PERIOD_DAYS = 4;
        // Check minimum age for first dose
        if (doseNumber === 1) {
            const ageAtDose = getAgeInDays(birthDate, doseDate);
            const daysDiff = rules.minimumAge - ageAtDose;
            return daysDiff > GRACE_PERIOD_DAYS;
        }
        // Check minimum interval from previous dose
        if (previousDoseDate && doseNumber > 1) {
            const daysBetween = getAgeInDays(previousDoseDate, doseDate);
            const requiredInterval = Array.isArray(rules.minimumIntervals)
                ? rules.minimumIntervals[doseNumber - 2] || 28
                : 28;
            const daysDiff = requiredInterval - daysBetween;
            return daysDiff > GRACE_PERIOD_DAYS;
        }
        return false;
    }
    getVaccineRecommendation(vaccineName, birthDate, currentDate, doses, specialConditions, immunityEvidence) {
        const normalizedName = this.normalizeVaccineName(vaccineName);
        const sortedDoses = doses.sort((a, b) => a.date.getTime() - b.date.getTime());
        // Validate doses for early administration
        const validDoses = [];
        const earlyDoses = [];
        sortedDoses.forEach((dose, index) => {
            const previousDose = index > 0 ? validDoses[validDoses.length - 1] : null;
            const isEarly = isDoseTooEarly(normalizedName, index + 1, birthDate, dose.date, previousDose?.date || null);
            if (isEarly) {
                earlyDoses.push(index + 1);
            }
            else {
                validDoses.push(dose);
            }
        });
        const numDoses = validDoses.length;
        const currentAgeDays = getAgeInDays(birthDate, currentDate);
        const currentAgeMonths = getAgeInMonths(birthDate, currentDate);
        const currentAgeYears = getAgeInYears(birthDate, currentDate);
        let recommendation = '';
        let nextDoseDate;
        let seriesComplete = false;
        const notes = [];
        let decisionType = 'routine';
        const contraindications = [];
        const precautions = [];
        const specialSituations = [];
        // Add notes about early doses
        if (earlyDoses.length > 0) {
            notes.push(`⚠️ Dose(s) ${earlyDoses.join(', ')} given too early per CDC guidelines - not counted`);
        }
        // Check for evidence of immunity
        if (immunityEvidence?.[normalizedName]) {
            seriesComplete = true;
            recommendation = 'Series complete due to evidence of immunity';
            notes.push('Immunity confirmed (e.g., lab results or disease history); no further doses needed per CDC');
            return {
                vaccineName: vaccineNameMapper.getAgeSpecificDisplay(normalizedName, currentAgeYears),
                recommendation,
                nextDoseDate,
                seriesComplete,
                notes,
                decisionType: 'not-recommended',
                contraindications,
                precautions,
                specialSituations
            };
        }
        const safeSpecialConditions = specialConditions || {};
        // Get recommendation from individual vaccine function
        let vaccineRecommendation;
        switch (normalizedName) {
            case 'hepatitis_b':
                vaccineRecommendation = hepatitisBRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'rotavirus':
                vaccineRecommendation = rotavirusRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'dtap_tdap':
                vaccineRecommendation = dtapTdapRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'hib':
                vaccineRecommendation = hibRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'pneumococcal':
                vaccineRecommendation = pneumococcalRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'ipv':
            case 'polio':
                vaccineRecommendation = ipvRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'mmr':
                vaccineRecommendation = mmrRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'var':
            case 'varicella':
                vaccineRecommendation = varicellaRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'hepatitis_a':
            case 'hepa':
            case 'hepatitis a':
                vaccineRecommendation = hepaRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'tdap':
                vaccineRecommendation = tdapRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'hpv':
                vaccineRecommendation = hpvRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'meningococcal_acwy':
                vaccineRecommendation = meningococcalACWYRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'meningococcal_b':
                vaccineRecommendation = meningococcalBRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'covid19':
                vaccineRecommendation = covid19Recommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'influenza':
                vaccineRecommendation = influenzaRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'dengue':
                vaccineRecommendation = dengueRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'rsv':
                vaccineRecommendation = rsvRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'japanese_encephalitis':
                vaccineRecommendation = japaneseEncephalitisRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'yellow_fever':
                vaccineRecommendation = yellowFeverRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'typhoid':
                vaccineRecommendation = typhoidRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            case 'cholera':
                vaccineRecommendation = choleraRecommendation(normalizedName, birthDate, currentDate, validDoses, numDoses, sortedDoses, safeSpecialConditions, immunityEvidence);
                break;
            default:
                // Create a default recommendation for unrecognized vaccines
                vaccineRecommendation = {
                    vaccineName: vaccineNameMapper.getAgeSpecificDisplay(normalizedName, currentAgeYears),
                    recommendation: 'No specific recommendation; consult CDC guidelines',
                    nextDoseDate: undefined,
                    seriesComplete: false,
                    notes: ['Vaccine not in standard catch-up schedule or name not recognized'],
                    decisionType: 'routine'
                };
                break;
        }
        // If vaccine function returned null (age-ineligible), return null
        if (!vaccineRecommendation) {
            return null;
        }
        // Post-process completed vaccines to add schedule status
        if (vaccineRecommendation.seriesComplete && validDoses.length > 0) {
            const scheduleStatus = this.getScheduleStatus(normalizedName, birthDate, validDoses, currentAgeYears);
            // Add schedule status as the first note for completed vaccines
            const scheduleNote = scheduleStatus === 'normal-schedule'
                ? '✓ Series completed on normal schedule'
                : scheduleStatus === 'catch-up-schedule'
                    ? '📅 Series completed using catch-up schedule'
                    : '📋 Schedule status could not be determined';
            // Add schedule note as the first note
            vaccineRecommendation.notes = [scheduleNote, ...vaccineRecommendation.notes];
        }
        return vaccineRecommendation;
    }
    async generateCatchUpRecommendations(request) {
        const birthDate = this.parseDate(request.birthDate);
        const currentDate = request.currentDate ? this.parseDate(request.currentDate) : new Date();
        const specialConditions = request.specialConditions || {};
        const patientAge = this.calculateAge(birthDate, currentDate);
        const recommendations = [];
        // Standard vaccine list for catch-up schedules
        const standardVaccines = [
            'HepB', 'Rotavirus', 'DTaP', 'Hib', 'PCV', 'IPV', 'COVID-19', 'Influenza',
            'MMR', 'VAR', 'HepA', 'HPV', 'MenACWY', 'MenB', 'Dengue', 'RSV'
        ];
        // Process each vaccine in the history
        const processedVaccines = new Set();
        // First, combine vaccine histories that should be treated as the same series
        const combinedHistories = new Map();
        for (const vaccineHistory of request.vaccineHistory) {
            const normalizedName = this.normalizeVaccineName(vaccineHistory.vaccineName);
            if (!combinedHistories.has(normalizedName)) {
                // Use age-appropriate vaccine name for DTaP/Tdap
                let appropriateVaccineName = vaccineHistory.vaccineName;
                if (normalizedName === 'dtap_tdap') {
                    const ageInYears = getAgeInYears(birthDate, currentDate);
                    appropriateVaccineName = ageInYears >= 7 ? 'Tdap' : 'DTaP';
                }
                combinedHistories.set(normalizedName, {
                    vaccineName: appropriateVaccineName,
                    doses: []
                });
            }
            // Add doses to the combined history
            const doses = vaccineHistory.doses.map((dose) => ({
                date: this.parseDate(dose.date),
                product: dose.product
            }));
            combinedHistories.get(normalizedName).doses.push(...doses);
        }
        // Now process the combined histories
        for (const [normalizedName, history] of Array.from(combinedHistories)) {
            // Sort doses by date
            history.doses.sort((a, b) => a.date.getTime() - b.date.getTime());
            const recommendation = this.getVaccineRecommendation(history.vaccineName, birthDate, currentDate, history.doses, specialConditions, request.immunityEvidence);
            // Only add non-null recommendations (excludes age-ineligible vaccines)
            if (recommendation !== null) {
                recommendations.push(recommendation);
            }
            processedVaccines.add(normalizedName);
        }
        // Add recommendations for vaccines not in history
        for (const vaccine of standardVaccines) {
            const normalizedVaccine = this.normalizeVaccineName(vaccine);
            // Skip if already processed (including DTaP/Tdap which share the same normalized name)
            if (!processedVaccines.has(normalizedVaccine)) {
                const recommendation = this.getVaccineRecommendation(vaccine, birthDate, currentDate, [], specialConditions, request.immunityEvidence);
                // Safety check for null/undefined recommendations (age-ineligible vaccines)
                if (!recommendation) {
                    // Null means patient is age-ineligible for this vaccine (e.g., too old for rotavirus)
                    continue;
                }
                // Only add if not a duplicate (check by vaccine name)
                const isDuplicate = recommendations.some(r => r && this.normalizeVaccineName(r.vaccineName) === normalizedVaccine);
                if (!isDuplicate) {
                    recommendations.push(recommendation);
                }
            }
        }
        return {
            patientAge,
            recommendations: recommendations
                .filter(r => r && r.vaccineName) // Remove undefined recommendations
                .sort((a, b) => a.vaccineName.localeCompare(b.vaccineName)),
            cdcVersion: "2025.1",
            processedAt: new Date().toISOString()
        };
    }
}
