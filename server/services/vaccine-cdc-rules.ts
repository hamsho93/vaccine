// CDC 2025 Comprehensive Vaccine Rules including contraindications, precautions, and special situations

export interface VaccineDose {
  date: Date;
  wasEarly?: boolean; // If dose was given ≥5 days early
}

export interface SpecialConditions {
  immunocompromised?: boolean;
  pregnancy?: boolean;
  hivInfection?: boolean;
  asplenia?: boolean;
  cochlearImplant?: boolean;
  csfLeak?: boolean;
  diabetes?: boolean;
  chronicHeartDisease?: boolean;
  chronicLungDisease?: boolean;
  chronicLiverDisease?: boolean;
  chronicKidneyDisease?: boolean;
}

export interface ProductVariant {
  doses: number;
  minimumIntervals: number[]; // in days
  notes?: string[];
}

export interface CDCVaccineRules {
  minimumAge: number; // in days
  dosesRequired: number | ((age: number) => number);
  minimumIntervals: number[] | ((ageYears: number) => number[]); // in days - can be age-dependent
  maximumAge?: number; // in days
  contraindications: string[];
  precautions: string[];
  specialSituations: {
    condition: keyof SpecialConditions;
    modification: string;
  }[];
  notes: string[];
  productVariants?: Record<string, ProductVariant>; // Product-specific schedules
  catchUpRules?: Record<string, any>; // Age-specific catch-up rules
  isAnnual?: boolean; // For seasonal vaccines like flu
}

// Grace period: doses given ≤4 days early are valid
const GRACE_PERIOD_DAYS = 4;

// Helper to check if dose was given too early
export function isDoseTooEarly(doseDate: Date, minimumDate: Date): boolean {
  const daysDiff = Math.floor((minimumDate.getTime() - doseDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff > GRACE_PERIOD_DAYS;
}

// Helper to calculate calendar months
export function addCalendarMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  // Handle month overflow (e.g., Jan 31 + 1 month = Feb 28/29)
  if (result.getDate() !== date.getDate()) {
    result.setDate(0); // Go to last day of previous month
  }
  return result;
}

// Comprehensive CDC vaccine rules
export const cdcVaccineRules: Record<string, CDCVaccineRules> = {
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
    minimumAge: 4015, // 11 years
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
      "If DTaP series incomplete, use Tdap for catch-up",
      "Tdap can be given regardless of interval since last tetanus or diphtheria-toxoid containing vaccine"
    ]
  },
  
  'haemophilus_influenzae_type_b': {
    minimumAge: 42, // 6 weeks
    dosesRequired: (age) => {
      if (age < 180) return 4; // < 6 months: 4 doses
      if (age < 365) return 3; // 6-11 months: 3 doses
      if (age < 1825) return 1; // 12-59 months: 1 dose
      return 0; // ≥60 months: not routinely recommended
    },
    minimumIntervals: [28, 28, 56], // 4 weeks, 4 weeks, 8 weeks
    maximumAge: 1825, // 5 years (only for high-risk)
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
      if (age < 730) return 4; // < 24 months: 4 doses
      if (age < 1825) return 1; // 24-59 months: 1 dose if healthy, 2 if at risk
      return 0; // ≥5 years: only for risk conditions
    },
    minimumIntervals: [28, 28, 56], // 4 weeks, 4 weeks, 8 weeks
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
        modification: "May give if not severely immunocompromised (CD4 ≥15%)"
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
    minimumIntervals: (ageYears: number) => ageYears < 13 ? [90] : [28], // 3 months if <13y, 4 weeks if ≥13y
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
      if (age < 4015) return 0; // Not routine before 11 years unless high-risk
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
        modification: "2-dose primary series 8 weeks apart, then booster every 5 years"
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
    dosesRequired: 1, // Default, varies by age and product
    minimumIntervals: [28], // 4 weeks minimum
    productVariants: {
      'Pfizer': {
        doses: 3, // For 6m-4y: 3 doses; ≥5y: 1 dose
        minimumIntervals: [21, 56], // 21 days, then 56 days for 6m-4y
        notes: ["6 months-4 years: 3-dose series (0, 3, 8 weeks)", "≥5 years: 1 dose"]
      },
      'Moderna': {
        doses: 2, // For 6m-4y: 2 doses; ≥5y: 1 dose
        minimumIntervals: [28], // 28 days for 6m-4y
        notes: ["6 months-4 years: 2-dose series (0, 4 weeks)", "≥5 years: 1 dose"]
      },
      'Unknown': {
        doses: 1,
        minimumIntervals: [28],
        notes: ["Follow current CDC guidance for specific product"]
      }
    },
    isAnnual: true, // Updated annually like influenza
    contraindications: [
      "Severe allergic reaction to previous dose",
      "Known allergy to vaccine component"
    ],
    precautions: [
      "Moderate or severe acute illness with or without fever",
      "History of myocarditis or pericarditis"
    ],
    specialSituations: [
      {
        condition: "immunocompromised",
        modification: "Additional doses recommended; 3-dose primary series plus additional doses"
      }
    ],
    notes: [] // Age-appropriate notes are now generated dynamically in vaccine-catchup.ts
  }
};

// Helper to get appropriate vaccine rules based on normalized name
export function getVaccineRules(normalizedVaccineName: string): CDCVaccineRules | undefined {
  return cdcVaccineRules[normalizedVaccineName];
}

// Check if patient has contraindications
export function checkContraindications(
  vaccineName: string,
  patientHistory?: string[]
): string[] {
  const rules = getVaccineRules(vaccineName);
  if (!rules) return [];
  
  // This would be enhanced with actual patient history checking
  // For now, return potential contraindications for awareness
  return rules.contraindications;
}

// Check if patient has precautions
export function checkPrecautions(
  vaccineName: string,
  patientHistory?: string[]
): string[] {
  const rules = getVaccineRules(vaccineName);
  if (!rules) return [];
  
  return rules.precautions;
}

// Get special situation modifications
export function getSpecialSituationModifications(
  vaccineName: string,
  specialConditions?: SpecialConditions
): string[] {
  const rules = getVaccineRules(vaccineName);
  if (!rules || !specialConditions) return [];
  
  const modifications: string[] = [];
  
  for (const situation of rules.specialSituations) {
    if (specialConditions[situation.condition]) {
      modifications.push(situation.modification);
    }
  }
  
  return modifications;
}