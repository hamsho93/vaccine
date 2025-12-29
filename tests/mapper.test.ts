import { describe, it, expect } from 'vitest';
import { vaccineNameMapper } from '../packages/my-shared-backend/server/services/vaccine-name-mapper';

describe('vaccineNameMapper', () => {
  it('normalizes DTaP synonyms to internal code', () => {
    expect(vaccineNameMapper.toInternal('DTaP')).toBe('dtap_tdap');
    expect(vaccineNameMapper.toInternal('tetanus diphtheria pertussis')).toBe('dtap_tdap');
  });

  it('returns age-specific display name', () => {
    expect(vaccineNameMapper.getAgeSpecificDisplay('dtap_tdap', 4)).toContain('DTaP');
    expect(vaccineNameMapper.getAgeSpecificDisplay('dtap_tdap', 12)).toContain('Tdap');
  });
});

// Layer 3: Validation tests for common AI parser outputs
// These tests ensure that vaccine names output by the AI parser are correctly recognized
describe('vaccineNameMapper - AI Parser Output Recognition', () => {
  
  describe('Pneumococcal variants (bug fix for doctor report)', () => {
    it.each([
      'Pneumococcal Conjugate',
      'Pneumococcal Conjugate, Unspecified',
      'pneumococcal conjugate vaccine',
      'PCV',
      'PCV13',
      'PCV15',
      'PCV20',
      'Prevnar',
      'Prevnar 13',
      'Pneumococcal',
      'Pneumococcal Polysaccharide',
      'PPSV23',
      'Pneumovax',
    ])('should recognize "%s" as pneumococcal', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('pneumococcal');
      expect(vaccineNameMapper.isRecognized(vaccineName)).toBe(true);
    });
  });

  describe('Hepatitis B variants', () => {
    it.each([
      'Hepatitis B',
      'Hepatitis B, Unspecified',
      'Hep B',
      'Hep B, Unspecified',
      'HepB',
      'Hepatitis-B',
      'Engerix-B',
      'Recombivax HB',
    ])('should recognize "%s" as hepatitis_b', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('hepatitis_b');
    });
  });

  describe('Hepatitis A variants', () => {
    it.each([
      'Hepatitis A',
      'Hepatitis A, Unspecified',
      'Hep A',
      'HepA',
      'Havrix',
      'Vaqta',
    ])('should recognize "%s" as hepatitis_a', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('hepatitis_a');
    });
  });

  describe('Polio variants', () => {
    it.each([
      'Poliovirus',
      'Poliovirus, Unspecified',
      'Polio',
      'Polio, Unspecified',
      'IPV',
      'Inactivated Poliovirus',
      'Inactivated Polio',
      'OPV',
    ])('should recognize "%s" as polio', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('polio');
    });
  });

  describe('Rotavirus variants', () => {
    it.each([
      'Rotavirus',
      'Rotavirus, Unspecified',
      'Rotarix',
      'RotaTeq',
      'RV',
      'RV1',
      'RV5',
    ])('should recognize "%s" as rotavirus', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('rotavirus');
    });
  });

  describe('Varicella variants', () => {
    it.each([
      'Varicella',
      'Varicella (Chicken Pox)',
      'Chickenpox',
      'Chicken Pox',
      'VAR',
      'Varivax',
    ])('should recognize "%s" as varicella', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('varicella');
    });
  });

  describe('MMR variants', () => {
    it.each([
      'MMR',
      'Measles, Mumps, and Rubella',
      'Measles Mumps Rubella',
      'M-M-R',
      'Priorix',
    ])('should recognize "%s" as mmr', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('mmr');
    });
  });

  describe('DTaP/Tdap variants', () => {
    it.each([
      'DTaP',
      'DTaP, Unspecified',
      'Tdap',
      'Diphtheria, Tetanus, and Pertussis',
      'Diphtheria Tetanus Pertussis',
      'Infanrix',
      'Daptacel',
      'Pediarix',
      'Adacel',
      'Boostrix',
    ])('should recognize "%s" as dtap_tdap', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('dtap_tdap');
    });
  });

  describe('Hib variants', () => {
    it.each([
      'Hib',
      'HIB',
      'HiB',
      'Haemophilus influenzae type b',
      'Haemophilus',
      'ActHIB',
      'PedvaxHIB',
    ])('should recognize "%s" as hib', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('hib');
    });
  });

  describe('Influenza variants', () => {
    it.each([
      'Influenza',
      'Influenza, Unspecified',
      'Flu',
      'Flu Shot',
      'Seasonal Flu',
      'Fluzone',
      'FluMist',
    ])('should recognize "%s" as influenza', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('influenza');
    });
  });

  describe('COVID-19 variants', () => {
    it.each([
      'COVID-19',
      'COVID',
      'Covid-19',
      'Coronavirus',
      'Pfizer',
      'Moderna',
      'Comirnaty',
      'Spikevax',
    ])('should recognize "%s" as covid19', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('covid19');
    });
  });

  describe('Meningococcal variants', () => {
    it.each([
      'MenACWY',
      'Meningococcal ACWY',
      'Meningococcal',
      'Menactra',
      'Menveo',
    ])('should recognize "%s" as meningococcal_acwy', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('meningococcal_acwy');
    });

    it.each([
      'MenB',
      'Meningococcal B',
      'Bexsero',
      'Trumenba',
    ])('should recognize "%s" as meningococcal_b', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('meningococcal_b');
    });
  });

  describe('HPV variants', () => {
    it.each([
      'HPV',
      'Human Papillomavirus',
      'Gardasil',
      'Gardasil 9',
      'Cervarix',
    ])('should recognize "%s" as hpv', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('hpv');
    });
  });

  describe('RSV variants', () => {
    it.each([
      'RSV',
      'Respiratory Syncytial Virus',
      'Respiratory Syncytial',
      'Abrysvo',
      'Arexvy',
    ])('should recognize "%s" as rsv', (vaccineName) => {
      const internal = vaccineNameMapper.toInternal(vaccineName);
      expect(internal).toBe('rsv');
    });
  });
});


