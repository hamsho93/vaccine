// Centralized vaccine name mapping for consistent recognition across the system
export interface VaccineMappingEntry {
  standardName: string;      // CDC standard name
  internalCode: string;      // Internal normalized code
  displayName: string;       // User-friendly display name
  abbreviations: string[];   // Common abbreviations
  variants: string[];        // All possible name variations
}

// Comprehensive vaccine mapping database
export const VACCINE_MAPPINGS: VaccineMappingEntry[] = [
  // Hepatitis B
  {
    standardName: 'Hepatitis B',
    internalCode: 'hepatitis_b',
    displayName: 'Hepatitis B',
    abbreviations: ['HepB', 'Hep B'],
    variants: [
      'hepatitis b', 'hep b', 'hepb', 'hepatitis-b', 'hbv', 'engerix-b', 
      'recombivax hb', 'recombivax', 'heplisav-b', 'heplisav'
    ]
  },
  
  // Rotavirus
  {
    standardName: 'Rotavirus',
    internalCode: 'rotavirus',
    displayName: 'Rotavirus',
    abbreviations: ['RV', 'RV1', 'RV5'],
    variants: [
      'rotavirus', 'rv', 'rv1', 'rv5', 'rotarix', 'rotateq', 
      'monovalent', 'pentavalent'
    ]
  },
  
  // DTaP (Diphtheria, Tetanus, acellular Pertussis) - Children under 7
  {
    standardName: 'Diphtheria, Tetanus, and acellular Pertussis',
    internalCode: 'dtap_tdap',
    displayName: 'DTaP',
    abbreviations: ['DTaP', 'DTP'],
    variants: [
      'dtap', 'dtp', 'diphtheria', 'tetanus', 'pertussis', 
      'diphtheria-tetanus-pertussis', 'diphtheria tetanus pertussis',
      'diphtheria, tetanus, and pertussis', 'diphtheria tetanus and pertussis',
      'infanrix', 'daptacel', 'pediarix', 'pentacel', 'kinrix', 'quadracel', 'vaxelis'
    ]
  },

  // Tdap (Tetanus, diphtheria, acellular pertussis) - Adolescents and adults
  {
    standardName: 'Tetanus, Diphtheria, and acellular Pertussis',
    internalCode: 'dtap_tdap',
    displayName: 'Tdap',
    abbreviations: ['Tdap', 'Td'],
    variants: [
      'tdap', 'td', 'tetanus', 'diphtheria', 'pertussis', 
      'tetanus-diphtheria-pertussis', 'tetanus diphtheria pertussis',
      'adacel', 'boostrix'
    ]
  },
  
  // Haemophilus influenzae type b
  {
    standardName: 'Haemophilus influenzae type b',
    internalCode: 'hib',
    displayName: 'HIB',
    abbreviations: ['Hib', 'HIB'],
    variants: [
      'hib', 'haemophilus', 'h influenzae', 'haemophilus influenzae', 
      'haemophilus influenzae type b', 'pedvaxhib', 'acthib', 'hiberix',
      'menhibrix', 'h. influenzae', 'h.influenzae'
    ]
  },
  
  // Pneumococcal
  {
    standardName: 'Pneumococcal',
    internalCode: 'pneumococcal',
    displayName: 'Pneumococcal (PCV)',
    abbreviations: ['PCV', 'PCV13', 'PCV15', 'PCV20', 'PPSV23'],
    variants: [
      'pcv', 'pcv13', 'pcv15', 'pcv20', 'pneumococcal', 'pneumo', 
      'prevnar', 'prevnar13', 'prevnar20', 'vaxneuvance', 'ppsv23', 
      'pneumovax', 'pneumovax23', 'ppsv', 'ppv'
    ]
  },
  
  // Inactivated Poliovirus
  {
    standardName: 'Inactivated Poliovirus',
    internalCode: 'polio',
    displayName: 'Polio (IPV)',
    abbreviations: ['IPV', 'OPV'],
    variants: [
      'ipv', 'polio', 'poliovirus', 'inactivated polio', 'opv',
      'oral polio', 'ipol', 'poliovax'
    ]
  },
  
  // Influenza
  {
    standardName: 'Influenza',
    internalCode: 'influenza',
    displayName: 'Influenza',
    abbreviations: ['Flu'],
    variants: [
      'influenza', 'flu', 'flu shot', 'seasonal flu', 'trivalent', 
      'quadrivalent', 'tiv', 'qiv', 'laiv', 'flumist', 'fluzone',
      'fluarix', 'fluvirin', 'flucelvax', 'afluria'
    ]
  },
  
  // MMR
  {
    standardName: 'Measles, Mumps, and Rubella',
    internalCode: 'mmr',
    displayName: 'MMR',
    abbreviations: ['MMR'],
    variants: [
      'mmr', 'measles', 'mumps', 'rubella', 'german measles', 
      'm-m-r', 'priorix', 'measles mumps rubella'
    ]
  },
  
  // Varicella
  {
    standardName: 'Varicella',
    internalCode: 'varicella',
    displayName: 'Varicella',
    abbreviations: ['VAR', 'VZV'],
    variants: [
      'varicella', 'var', 'chickenpox', 'chicken pox', 'vzv', 
      'varivax', 'proquad', 'mmrv'
    ]
  },
  
  // Hepatitis A
  {
    standardName: 'Hepatitis A',
    internalCode: 'hepatitis_a',
    displayName: 'Hepatitis A',
    abbreviations: ['HepA', 'Hep A', 'HAV'],
    variants: [
      'hepa', 'hepatitis a', 'hepatitis-a', 'hep a', 'hav', 
      'havrix', 'vaqta', 'twinrix', 'hepatitis_a'
    ]
  },
  
  // Human Papillomavirus
  {
    standardName: 'Human Papillomavirus',
    internalCode: 'hpv',
    displayName: 'HPV',
    abbreviations: ['HPV'],
    variants: [
      'hpv', 'gardasil', 'cervarix', 'human papillomavirus', 
      'hpv9', 'hpv4', 'hpv2', 'gardasil 9', 'gardasil9'
    ]
  },
  
  // Meningococcal ACWY
  {
    standardName: 'Meningococcal ACWY',
    internalCode: 'meningococcal_acwy',
    displayName: 'MenACWY',
    abbreviations: ['MenACWY', 'MCV4', 'MenA'],
    variants: [
      'menacwy', 'mena', 'menacwy-d', 'menacwy-crm', 'menveo', 
      'menquadfi', 'meningococcal', 'mcv4', 'menactra', 'nimenrix',
      'men acwy', 'meningococcal acwy'
    ]
  },
  
  // Meningococcal B
  {
    standardName: 'Meningococcal B',
    internalCode: 'meningococcal_b',
    displayName: 'MenB',
    abbreviations: ['MenB'],
    variants: [
      'menb', 'meningococcal b', 'bexsero', 'trumenba', 
      'men b', 'meningococcal serogroup b', 'menb-fhbp', 'menb-4c'
    ]
  },
  
  // COVID-19
  {
    standardName: 'COVID-19',
    internalCode: 'covid19',
    displayName: 'COVID-19',
    abbreviations: ['COVID'],
    variants: [
      'covid', 'covid-19', 'covid19', 'coronavirus', 'sars-cov-2', 
      'pfizer', 'moderna', 'johnson', 'janssen', 'j&j', 'novavax',
      'comirnaty', 'spikevax', 'pfizer-biontech', 'bnt162b2'
    ]
  },
  
  // RSV
  {
    standardName: 'Respiratory Syncytial Virus',
    internalCode: 'rsv',
    displayName: 'RSV',
    abbreviations: ['RSV'],
    variants: [
      'rsv', 'respiratory syncytial virus', 'respiratory syncytial', 
      'abrysvo', 'arexvy', 'synagis', 'beyfortus'
    ]
  },
  {
    standardName: 'Dengue',
    internalCode: 'dengue',
    displayName: 'Dengue',
    abbreviations: ['DEN'],
    variants: ['dengue', 'denv', 'dengvaxia']
  },

  // Japanese Encephalitis - Travel vaccine
  {
    standardName: 'Japanese Encephalitis',
    internalCode: 'japanese_encephalitis',
    displayName: 'Japanese Encephalitis',
    abbreviations: ['JE'],
    variants: [
      'japanese encephalitis', 'je', 'ixiaro', 'japanese encephalitis virus'
    ]
  },

  // Yellow Fever - Travel vaccine  
  {
    standardName: 'Yellow Fever',
    internalCode: 'yellow_fever',
    displayName: 'Yellow Fever',
    abbreviations: ['YF'],
    variants: [
      'yellow fever', 'yf', 'yf-vax', 'stamaril', 'yellow fever vaccine'
    ]
  },

  // Typhoid - Travel vaccine
  {
    standardName: 'Typhoid',
    internalCode: 'typhoid',
    displayName: 'Typhoid',
    abbreviations: ['Vi', 'Ty21a'],
    variants: [
      'typhoid', 'typhoid fever', 'vi', 'ty21a', 'typhim vi', 'vivotif'
    ]
  },

  // Cholera - Travel vaccine
  {
    standardName: 'Cholera',
    internalCode: 'cholera',
    displayName: 'Cholera',
    abbreviations: ['CVD'],
    variants: [
      'cholera', 'vaxchora', 'cholera vaccine', 'cvd'
    ]
  }
];

// Key tokens for fuzzy/fallback matching when exact match fails
// Order matters: more specific tokens should come first
const KEY_TOKENS: Array<[string, string]> = [
  // Pneumococcal - the key fix for the doctor's bug report
  ['pneumococcal conjugate', 'pneumococcal'],
  ['pneumococcal polysaccharide', 'pneumococcal'],
  ['pneumococcal', 'pneumococcal'],
  ['pcv', 'pneumococcal'],
  ['prevnar', 'pneumococcal'],
  ['pneumovax', 'pneumococcal'],
  
  // Hepatitis - must check "hepatitis b" before just "hepatitis"
  ['hepatitis b', 'hepatitis_b'],
  ['hep b', 'hepatitis_b'],
  ['hepb', 'hepatitis_b'],
  ['hepatitis a', 'hepatitis_a'],
  ['hep a', 'hepatitis_a'],
  ['hepa', 'hepatitis_a'],
  
  // Polio variants
  ['poliovirus', 'polio'],
  ['polio', 'polio'],
  ['ipv', 'polio'],
  
  // Rotavirus
  ['rotavirus', 'rotavirus'],
  ['rotarix', 'rotavirus'],
  ['rotateq', 'rotavirus'],
  
  // Varicella
  ['varicella', 'varicella'],
  ['chickenpox', 'varicella'],
  ['chicken pox', 'varicella'],
  
  // MMR
  ['mmr', 'mmr'],
  ['measles', 'mmr'],
  ['mumps', 'mmr'],
  ['rubella', 'mmr'],
  
  // DTaP/Tdap - check more specific patterns first
  ['dtap', 'dtap_tdap'],
  ['tdap', 'dtap_tdap'],
  ['diphtheria', 'dtap_tdap'],
  ['pertussis', 'dtap_tdap'],
  
  // Hib
  ['haemophilus', 'hib'],
  ['hib', 'hib'],
  
  // Influenza
  ['influenza', 'influenza'],
  ['flu', 'influenza'],
  
  // HPV
  ['papillomavirus', 'hpv'],
  ['hpv', 'hpv'],
  ['gardasil', 'hpv'],
  
  // Meningococcal - check specific types first (order matters!)
  // MenB patterns must come before generic "meningococcal"
  ['meningococcal_b', 'meningococcal_b'],  // Internal code format
  ['meningococcal b', 'meningococcal_b'],
  ['meningococcal-b', 'meningococcal_b'],
  ['menb', 'meningococcal_b'],
  ['bexsero', 'meningococcal_b'],
  ['trumenba', 'meningococcal_b'],
  ['serogroup b', 'meningococcal_b'],
  // MenACWY patterns
  ['meningococcal_acwy', 'meningococcal_acwy'],  // Internal code format
  ['meningococcal acwy', 'meningococcal_acwy'],
  ['meningococcal-acwy', 'meningococcal_acwy'],
  ['menacwy', 'meningococcal_acwy'],
  ['menactra', 'meningococcal_acwy'],
  ['menveo', 'meningococcal_acwy'],
  // Generic meningococcal defaults to ACWY (must be last!)
  ['meningococcal', 'meningococcal_acwy'],
  
  // COVID
  ['covid', 'covid19'],
  ['coronavirus', 'covid19'],
  ['sars-cov', 'covid19'],
  
  // RSV
  ['rsv', 'rsv'],
  ['respiratory syncytial', 'rsv'],
  
  // Dengue
  ['dengue', 'dengue'],
  ['dengvaxia', 'dengue'],
  
  // Travel vaccines
  ['japanese encephalitis', 'japanese_encephalitis'],
  ['yellow fever', 'yellow_fever'],
  ['typhoid', 'typhoid'],
  ['cholera', 'cholera'],
];

export class VaccineNameMapper {
  private static instance: VaccineNameMapper;
  private nameToInternalMap: Map<string, string> = new Map();
  private internalToDisplayMap: Map<string, string> = new Map();
  private internalToStandardMap: Map<string, string> = new Map();
  private internalToEntryMap: Map<string, VaccineMappingEntry> = new Map();
  
  private constructor() {
    this.buildMaps();
  }
  
  static getInstance(): VaccineNameMapper {
    if (!VaccineNameMapper.instance) {
      VaccineNameMapper.instance = new VaccineNameMapper();
    }
    return VaccineNameMapper.instance;
  }
  
  private buildMaps(): void {
    for (const mapping of VACCINE_MAPPINGS) {
      // Map internal code to entry
      this.internalToEntryMap.set(mapping.internalCode, mapping);
      
      // Map internal code to display name
      this.internalToDisplayMap.set(mapping.internalCode, mapping.displayName);
      
      // Map internal code to standard name
      this.internalToStandardMap.set(mapping.internalCode, mapping.standardName);
      
      // Map all variations to internal code
      // Standard name
      this.nameToInternalMap.set(mapping.standardName.toLowerCase(), mapping.internalCode);
      
      // Display name
      this.nameToInternalMap.set(mapping.displayName.toLowerCase(), mapping.internalCode);
      
      // Abbreviations
      for (const abbr of mapping.abbreviations) {
        this.nameToInternalMap.set(abbr.toLowerCase(), mapping.internalCode);
      }
      
      // All variants
      for (const variant of mapping.variants) {
        this.nameToInternalMap.set(variant.toLowerCase(), mapping.internalCode);
      }
    }
  }
  
  // Fallback token-based matching for fuzzy recognition
  private tokenMatch(normalized: string): string | null {
    for (const [token, internalCode] of KEY_TOKENS) {
      if (normalized.includes(token)) {
        return internalCode;
      }
    }
    return null;
  }
  
  // Convert any vaccine name to internal code
  // Uses 3-tier matching: exact -> token-based -> original
  toInternal(name: string): string {
    if (!name) return name;
    const normalized = name.toLowerCase().trim();
    
    // Tier 1: Exact match from the mapping tables
    const exactMatch = this.nameToInternalMap.get(normalized);
    if (exactMatch) return exactMatch;
    
    // Tier 2: Token-based fuzzy matching
    const tokenMatch = this.tokenMatch(normalized);
    if (tokenMatch) return tokenMatch;
    
    // Tier 3: Return original (unrecognized)
    return normalized;
  }
  
  // Convert internal code to display name
  toDisplay(internalCode: string): string {
    return this.internalToDisplayMap.get(internalCode) || internalCode;
  }
  
  // Convert internal code to CDC standard name
  toStandard(internalCode: string): string {
    return this.internalToStandardMap.get(internalCode) || internalCode;
  }
  
  // Get full mapping entry
  getMapping(name: string): VaccineMappingEntry | undefined {
    const internalCode = this.toInternal(name);
    return this.internalToEntryMap.get(internalCode);
  }
  
  // Check if a vaccine name is recognized (exact or token-based)
  isRecognized(name: string): boolean {
    const normalized = name.toLowerCase().trim();
    // Check exact match first
    if (this.nameToInternalMap.has(normalized)) return true;
    // Check token-based match
    return this.tokenMatch(normalized) !== null;
  }
  
  // Get the display name for age-specific vaccines
  getAgeSpecificDisplay(internalCode: string, ageInYears: number): string {
    if (internalCode === 'dtap_tdap') {
      return ageInYears >= 7 ? 'Tdap' : 'DTaP';
    }
    return this.toDisplay(internalCode);
  }
}

// Export singleton instance
export const vaccineNameMapper = VaccineNameMapper.getInstance();