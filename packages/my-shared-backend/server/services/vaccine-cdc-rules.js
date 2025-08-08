// CDC 2025 Comprehensive Vaccine Rules including contraindications, precautions, and special situations
// Grace period: doses given ≤4 days early are valid
const GRACE_PERIOD_DAYS = 4;
// Helper to calculate calendar months
export function addCalendarMonths(date, months) {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    // Handle month overflow (e.g., Jan 31 + 1 month = Feb 28/29)
    if (result.getDate() !== date.getDate()) {
        result.setDate(0); // Go to last day of previous month
    }
    return result;
}
// Comprehensive CDC vaccine rules
export const cdcVaccineRules = {
    'hepatitis_b': {
        minimumAge: 0, // Birth
        dosesRequired: 3,
        minimumIntervals: [28, 56], // 4 weeks between 1-2, 8 weeks between 2-3, AND 16 weeks between 1-3
        contraindications: [
            "Severe allergic reaction (anaphylaxis) after previous dose",
            "Severe allergy to any vaccine component including yeast"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever",
            "Infant weighing less than 2,000 grams (4 lbs, 6.4 oz)"
        ],
        specialSituations: [],
        notes: [
            "Birth dose should be administered within 24 hours of birth",
            "Minimum age for dose 3 is 24 weeks",
            "Minimum interval between dose 1 and 3 is 16 weeks"
        ]
    },
    'rotavirus': {
        minimumAge: 42, // 6 weeks
        dosesRequired: 3, // Default to most conservative per CDC if product unknown
        minimumIntervals: [28, 28], // 4 weeks between doses
        maximumAge: 238, // 8 months 0 days - do not start series
        productVariants: {
            'Rotarix': {
                doses: 2,
                minimumIntervals: [28], // 4 weeks
                notes: ["2-dose series: doses at 2 and 4 months"]
            },
            'RotaTeq': {
                doses: 3,
                minimumIntervals: [28, 28], // 4 weeks each
                notes: ["3-dose series: doses at 2, 4, and 6 months"]
            },
            'Unknown': {
                doses: 3,
                minimumIntervals: [28, 28], // Default to 3-dose per CDC
                notes: ["If product unknown or mixed, complete 3-dose series"]
            }
        },
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Severe combined immunodeficiency (SCID)",
            "History of intussusception"
        ],
        precautions: [
            "Altered immunocompetence other than SCID",
            "Moderate or severe acute gastroenteritis or other illness",
            "Chronic gastrointestinal disease",
            "Spina bifida or bladder exstrophy"
        ],
        specialSituations: [],
        notes: [
            "Maximum age for last dose is 8 months 0 days",
            "Do not start series on or after age 15 weeks 0 days"
        ]
    },
    'dtap': {
        minimumAge: 42, // 6 weeks
        dosesRequired: 5,
        minimumIntervals: [28, 28, 168, 168], // 4 weeks, 4 weeks, 6 months, 6 months
        maximumAge: 2555, // 7 years
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Encephalopathy within 7 days after previous dose"
        ],
        precautions: [
            "Progressive neurologic disorder",
            "Temperature ≥105°F (≥40.5°C) within 48 hours after previous dose",
            "Collapse or shock-like state within 48 hours after previous dose",
            "Seizure within 3 days after previous dose",
            "Persistent crying ≥3 hours within 48 hours after previous dose",
            "Guillain-Barré syndrome within 6 weeks after previous dose"
        ],
        specialSituations: [],
        notes: [
            "Dose 5 not necessary if dose 4 administered at age ≥4 years"
        ]
    },
    'tdap': {
        minimumAge: 2555, // 7 years for catch-up
        dosesRequired: 1,
        minimumIntervals: [],
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Encephalopathy within 7 days after previous DTP/DTaP/Tdap dose"
        ],
        precautions: [
            "Progressive neurologic disorder",
            "Guillain-Barré syndrome within 6 weeks after previous tetanus toxoid-containing vaccine",
            "History of Arthus-type hypersensitivity reactions after previous tetanus or diphtheria toxoid-containing vaccine"
        ],
        specialSituations: [
            {
                condition: "pregnancy",
                modification: "Administer 1 dose during each pregnancy, preferably in early third trimester"
            }
        ],
        notes: [
            "If DTaP series incomplete, use Tdap for catch-up starting at age 7",
            "Tdap can be given regardless of interval since last tetanus or diphtheria-toxoid containing vaccine",
            "Boosters: Td or Tdap every 10 years after initial Tdap"
        ]
    },
    'haemophilus_influenzae_type_b': {
        minimumAge: 42, // 6 weeks
        dosesRequired: (age) => {
            if (age < 180)
                return 4; // < 6 months: 4 doses
            if (age < 365)
                return 3; // 6-11 months: 3 doses
            if (age < 1825)
                return 1; // 12-59 months: 1 dose
            return 0; // ≥60 months: not routinely recommended
        },
        minimumIntervals: [28, 28, 56], // 4 weeks, 4 weeks, 8 weeks
        maximumAge: 1825, // 5 years (only for high-risk)
        catchUpRules: {
            '<7m': {
                doses: 4,
                intervals: [28, 28, 56],
                notes: ['3 primary doses + booster at 12-15 months']
            },
            '7-11m': {
                doses: 3,
                intervals: [28, 56],
                notes: ['2 primary doses + booster']
            },
            '12-14m': {
                doses: 2,
                intervals: [56],
                notes: ['1 dose + booster ≥8 weeks later']
            },
            '15-59m': {
                doses: 1,
                intervals: [],
                notes: ['Single dose if unvaccinated']
            }
        },
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Age less than 6 weeks"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever"
        ],
        specialSituations: [
            {
                condition: "immunocompromised",
                modification: "Administer through age 18 years"
            },
            {
                condition: "asplenia",
                modification: "Administer through age 18 years"
            }
        ],
        notes: [
            "First dose may be given as early as age 6 weeks",
            "Dose 3 (if needed) should be given at 6 months of age",
            "Dose 4 at 12-15 months"
        ]
    },
    'pneumococcal_conjugate': {
        minimumAge: 42, // 6 weeks
        dosesRequired: (age) => {
            if (age < 730)
                return 4; // < 24 months: 4 doses
            if (age < 1825)
                return 1; // 24-59 months: 1 dose if healthy, 2 if at risk
            return 0; // ≥5 years: only for risk conditions
        },
        minimumIntervals: [28, 28, 56], // 4 weeks, 4 weeks, 8 weeks
        catchUpRules: {
            '<7m': {
                doses: 4,
                intervals: [28, 28, 56],
                notes: ['3 primary doses + booster at 12-15 months']
            },
            '7-11m': {
                doses: 3,
                intervals: [28, 56],
                notes: ['2 primary doses + booster']
            },
            '12-23m': {
                doses: 2,
                intervals: [56],
                notes: ['2 doses ≥8 weeks apart']
            },
            '24-59m': {
                doses: 1,
                intervals: [],
                notes: ['Single dose if healthy, 2 doses if risk conditions']
            }
        },
        contraindications: [
            "Severe allergic reaction to previous dose"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever"
        ],
        specialSituations: [
            {
                condition: "immunocompromised",
                modification: "May need additional doses; consider PPSV23"
            },
            {
                condition: "cochlearImplant",
                modification: "Complete PCV series and give PPSV23 at ≥2 years"
            },
            {
                condition: "csfLeak",
                modification: "Complete PCV series and give PPSV23 at ≥2 years"
            },
            {
                condition: "asplenia",
                modification: "Complete PCV series and give PPSV23 at ≥2 years"
            }
        ],
        notes: [
            "Minimum age for dose 4 is 12 months",
            "Dose 3 should be given at 6 months"
        ]
    },
    'inactivated_poliovirus': {
        minimumAge: 42, // 6 weeks
        dosesRequired: 4,
        minimumIntervals: [28, 28, 168], // 4 weeks, 4 weeks, 6 months
        maximumAge: 6570, // 18 years
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Severe allergy to any vaccine component"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever",
            "Pregnancy"
        ],
        specialSituations: [],
        notes: [
            "Dose 4 must be given at ≥4 years AND ≥6 months after dose 3",
            "If dose 3 given at ≥4 years, dose 4 not needed"
        ]
    },
    'influenza': {
        minimumAge: 180, // 6 months
        dosesRequired: 1, // Annual
        minimumIntervals: [],
        isAnnual: true, // Seasonal vaccine
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Severe egg allergy for egg-based vaccines (use cell-culture or recombinant)"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever",
            "History of Guillain-Barré syndrome within 6 weeks of previous influenza vaccine"
        ],
        specialSituations: [],
        notes: [
            "Annual vaccination",
            "Children 6 months-8 years need 2 doses in first season of vaccination",
            "Doses separated by ≥4 weeks"
        ]
    },
    'measles_mumps_rubella': {
        minimumAge: 365, // 12 months
        dosesRequired: 2,
        minimumIntervals: [28], // 4 weeks
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Severe immunodeficiency",
            "Pregnancy"
        ],
        precautions: [
            "Recent blood product receipt",
            "Moderate or severe acute illness",
            "History of thrombocytopenia"
        ],
        specialSituations: [
            {
                condition: "hivInfection",
                modification: "May give if CD4 ≥15%"
            }
        ],
        notes: [
            "Dose 1 at 12-15 months",
            "Dose 2 at 4-6 years"
        ]
    },
    'varicella': {
        minimumAge: 365, // 12 months
        dosesRequired: 2,
        minimumIntervals: (ageYears) => ageYears < 13 ? [90] : [28], // 3 months if <13y, 4 weeks if ≥13y
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Severe immunodeficiency",
            "Pregnancy"
        ],
        precautions: [
            "Recent blood product receipt",
            "Moderate or severe acute illness"
        ],
        specialSituations: [
            {
                condition: "hivInfection",
                modification: "May give if CD4 ≥15%"
            }
        ],
        notes: [
            "Dose 1 at 12-15 months",
            "Dose 2 at 4-6 years",
            "Interval: 3 months if <13 years; 4 weeks if ≥13 years"
        ]
    },
    'hepatitis_a': {
        minimumAge: 365, // 12 months
        dosesRequired: 2,
        minimumIntervals: [180], // 6 months
        contraindications: [
            "Severe allergic reaction to previous dose"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever"
        ],
        specialSituations: [
            {
                condition: "chronicLiverDisease",
                modification: "Recommended regardless of age"
            }
        ],
        notes: [
            "2-dose series separated by 6 months",
            "Catch-up vaccination through 18 years"
        ]
    },
    'human_papillomavirus': {
        minimumAge: 3285, // 9 years
        dosesRequired: (age) => age < 5475 ? 2 : 3, // 2 doses if started <15 years, 3 if ≥15
        minimumIntervals: [150, 60], // 5 months for 2-dose, then 2 months + 4 months for 3-dose
        maximumAge: 9490, // 26 years
        contraindications: [
            "Severe allergic reaction to previous dose",
            "Severe allergy to any vaccine component"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever",
            "Pregnancy"
        ],
        specialSituations: [
            {
                condition: "immunocompromised",
                modification: "3-dose series regardless of age at initiation"
            }
        ],
        notes: [
            "Routine at 11-12 years",
            "2-dose series if started before 15th birthday with 5-month minimum interval",
            "3-dose series if started at ≥15 years or immunocompromised"
        ]
    },
    'meningococcal_acwy': {
        minimumAge: 60, // 2 months for high-risk
        dosesRequired: (age) => {
            if (age < 4015)
                return 0; // Not routine before 11 years unless high-risk
            return 2; // 2 doses: 11-12 years and 16 years
        },
        minimumIntervals: [56], // 8 weeks
        contraindications: [
            "Severe allergic reaction to previous dose"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever"
        ],
        specialSituations: [
            {
                condition: "asplenia",
                modification: "2-dose primary + boosters every 5 years"
            },
            {
                condition: "immunocompromised",
                modification: "2-dose primary series 8 weeks apart"
            }
        ],
        notes: [] // Age-appropriate notes are now generated dynamically in vaccine-catchup.ts
    },
    'meningococcal_b': {
        minimumAge: 3650, // 10 years
        dosesRequired: 2, // Shared clinical decision-making
        minimumIntervals: [28], // 4 weeks (product dependent)
        maximumAge: 8395, // 23 years preferred
        productVariants: {
            'Bexsero': {
                doses: 2,
                minimumIntervals: [28],
                notes: ['2 doses ≥1 month apart']
            },
            'Trumenba': {
                doses: 2,
                minimumIntervals: [183],
                notes: ['2 doses ≥6 months apart', '3 doses for high-risk (0,1-2m,6m)']
            },
            'Unknown': {
                doses: 2,
                minimumIntervals: [183],
                notes: ['Default to 6-month interval']
            }
        },
        contraindications: [
            "Severe allergic reaction to previous dose"
        ],
        precautions: [
            "Moderate or severe acute illness with or without fever"
        ],
        specialSituations: [
            {
                condition: "asplenia",
                modification: "Recommended; 2 or 3 doses depending on product"
            }
        ],
        notes: [] // Age-appropriate notes are now generated dynamically in vaccine-catchup.ts
    },
    'covid19': {
        minimumAge: 180, // 6 months
        dosesRequired: (ageYears) => ageYears < 5 ? 3 : 1, // Default to Pfizer-like
        minimumIntervals: [21, 28], // General intervals, product-specific logic handled in vaccine function
        contraindications: [],
        precautions: [],
        specialSituations: [],
        notes: ['Dosing varies by product: Moderna 2 doses, Pfizer 3 for <5y'],
    },
    'dengue': {
        minimumAge: 3285, // 9 years
        dosesRequired: 3,
        minimumIntervals: [183, 183], // 6 months each
        maximumAge: 5840, // 16 years
        contraindications: [],
        precautions: [],
        specialSituations: [],
        notes: ['Recommended for children 9-16 years in dengue-endemic areas with lab evidence of prior infection'],
    },
    'rsv': {
        minimumAge: 0, // Birth for nirsevimab
        dosesRequired: 1,
        minimumIntervals: [],
        contraindications: [],
        precautions: [],
        specialSituations: [],
        notes: ['Maternal Abrysvo during pregnancy weeks 32-36 or infant nirsevimab <8 months'],
    }
};
// Helper to get appropriate vaccine rules based on normalized name
export function getVaccineRules(normalizedVaccineName) {
    return cdcVaccineRules[normalizedVaccineName];
}
// Check if patient has contraindications
export function checkContraindications(vaccineName, patientHistory, specialConditions) {
    const rules = getVaccineRules(vaccineName);
    if (!rules)
        return [];
    const applicableContraindications = [];
    // Only add contraindications that actually apply to this patient
    // For now, we only check special conditions since we don't have detailed patient history
    if (specialConditions) {
        // Live vaccines contraindicated for immunocompromised patients
        if ((vaccineName === 'mmr' || vaccineName === 'varicella' || vaccineName === 'rotavirus') &&
            specialConditions.immunocompromised) {
            applicableContraindications.push('Severe immunodeficiency');
        }
        // Live vaccines contraindicated during pregnancy
        if ((vaccineName === 'mmr' || vaccineName === 'varicella') && specialConditions.pregnancy) {
            applicableContraindications.push('Pregnancy');
        }
    }
    // Without detailed patient history, we generally don't apply contraindications
    // unless there are specific conditions that warrant them
    return applicableContraindications;
}
// Check if patient has precautions
export function checkPrecautions(vaccineName, patientHistory) {
    const rules = getVaccineRules(vaccineName);
    if (!rules)
        return [];
    return rules.precautions;
}
// Get special situation modifications
export function getSpecialSituationModifications(vaccineName, specialConditions) {
    const rules = getVaccineRules(vaccineName);
    if (!rules || !specialConditions)
        return [];
    const modifications = [];
    for (const situation of rules.specialSituations) {
        if (specialConditions[situation.condition]) {
            modifications.push(situation.modification);
        }
    }
    return modifications;
}
