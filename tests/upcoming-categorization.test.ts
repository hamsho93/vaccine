import { describe, it, expect } from 'vitest';
import { mmrRecommendation } from '../packages/my-shared-backend/server/services/vaccines/mmr';
import { varicellaRecommendation } from '../packages/my-shared-backend/server/services/vaccines/varicella';
import { ipvRecommendation } from '../packages/my-shared-backend/server/services/vaccines/ipv';
import { pneumococcalRecommendation } from '../packages/my-shared-backend/server/services/vaccines/pneumococcal';
import { VaccineDoseInfo } from '../packages/my-shared-backend/server/services/vaccine-catchup';
import { SpecialConditions } from '../packages/my-shared-backend/server/services/vaccine-cdc-rules';

/**
 * These tests verify that vaccines correctly set nextDoseDate when:
 * 1. Patient is under minimum age
 * 2. Minimum interval between doses not yet met
 * 
 * This ensures vaccines will be categorized as "Upcoming" (not "Action Needed")
 * in the frontend when they have a future date.
 */

describe('Upcoming Categorization - Future Date Tests', () => {
  const specialConditions: SpecialConditions = {};

  describe('MMR - Under Minimum Age', () => {
    it('should set nextDoseDate for 10-month-old (minimum age is 12 months)', () => {
      const birthDate = new Date('2024-05-01');
      const currentDate = new Date('2025-03-01'); // 10 months old
      const validDoses: VaccineDoseInfo[] = [];

      const result = mmrRecommendation(
        'mmr',
        birthDate,
        currentDate,
        validDoses,
        0,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.nextDoseDate).toBeDefined();
      expect(result.recommendation).toContain('on or after');
      expect(result.seriesComplete).toBe(false);
    });
  });

  describe('Varicella - Under Minimum Age', () => {
    it('should set nextDoseDate for 8-month-old (minimum age is 12 months)', () => {
      const birthDate = new Date('2024-07-01');
      const currentDate = new Date('2025-03-01'); // 8 months old
      const validDoses: VaccineDoseInfo[] = [];

      const result = varicellaRecommendation(
        'varicella',
        birthDate,
        currentDate,
        validDoses,
        0,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.nextDoseDate).toBeDefined();
      expect(result.recommendation).toContain('on or after');
      expect(result.seriesComplete).toBe(false);
    });
  });

  describe('Varicella - Minimum Interval Not Met', () => {
    it('should set nextDoseDate when 2 weeks after first dose (minimum is 4 weeks)', () => {
      const birthDate = new Date('2020-01-01'); // 5 years old
      const firstDoseDate = new Date('2025-02-15');
      const currentDate = new Date('2025-03-01'); // 2 weeks after first dose
      const validDoses: VaccineDoseInfo[] = [{ date: firstDoseDate }];

      const result = varicellaRecommendation(
        'varicella',
        birthDate,
        currentDate,
        validDoses,
        1,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.nextDoseDate).toBeDefined();
      expect(result.recommendation).toContain('on or after');
      expect(result.seriesComplete).toBe(false);
      
      // Date should be in mid-March (4 weeks after Feb 15)
      expect(result.nextDoseDate).toContain('2025-03');
    });
  });

  describe('IPV (Polio) - Dose 4 Not Yet Due', () => {
    it('should set nextDoseDate for 3-year-old needing dose 4 (must be 4+ years old)', () => {
      const birthDate = new Date('2022-01-01');
      const currentDate = new Date('2025-03-01'); // 3 years, 2 months old
      const validDoses: VaccineDoseInfo[] = [
        { date: new Date('2022-03-01') }, // 2 months
        { date: new Date('2022-05-01') }, // 4 months
        { date: new Date('2022-07-01') }  // 6 months
      ];

      const result = ipvRecommendation(
        'ipv',
        birthDate,
        currentDate,
        validDoses,
        3,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.nextDoseDate).toBeDefined();
      expect(result.recommendation).toContain('on or after');
      expect(result.seriesComplete).toBe(false);
      
      // Should be due at 4 years old, which is around late December 2025
      expect(result.nextDoseDate).toContain('2025-12');
    });
  });

  describe('Pneumococcal - Under Minimum Age for First Dose', () => {
    it('should set nextDoseDate for 4-week-old infant (minimum age is 6 weeks)', () => {
      const birthDate = new Date('2025-02-01');
      const currentDate = new Date('2025-03-01'); // 4 weeks old
      const validDoses: VaccineDoseInfo[] = [];

      const result = pneumococcalRecommendation(
        'pneumococcal',
        birthDate,
        currentDate,
        validDoses,
        0,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.nextDoseDate).toBeDefined();
      expect(result.recommendation).toContain('on or after');
      expect(result.seriesComplete).toBe(false);
    });
  });

  describe('Pneumococcal - Minimum Interval Not Met Between Doses', () => {
    it('should set nextDoseDate when 2 weeks after first dose (minimum is 4 weeks)', () => {
      const birthDate = new Date('2024-11-01');
      const firstDoseDate = new Date('2025-01-01'); // 2 months old
      const currentDate = new Date('2025-01-15'); // 2 weeks after first dose
      const validDoses: VaccineDoseInfo[] = [{ date: firstDoseDate }];

      const result = pneumococcalRecommendation(
        'pneumococcal',
        birthDate,
        currentDate,
        validDoses,
        1,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.nextDoseDate).toBeDefined();
      expect(result.recommendation).toContain('on or after');
      expect(result.seriesComplete).toBe(false);
    });
  });

  describe('MMR - Minimum Interval Not Met for Dose 2', () => {
    it('should set nextDoseDate when 2 weeks after first dose (minimum is 4 weeks)', () => {
      const birthDate = new Date('2020-01-01'); // 5 years old
      const firstDoseDate = new Date('2025-02-15');
      const currentDate = new Date('2025-03-01'); // 2 weeks after first dose
      const validDoses: VaccineDoseInfo[] = [{ date: firstDoseDate }];

      const result = mmrRecommendation(
        'mmr',
        birthDate,
        currentDate,
        validDoses,
        1,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.nextDoseDate).toBeDefined();
      expect(result.recommendation).toContain('on or after');
      expect(result.seriesComplete).toBe(false);
      
      // Should be 4 weeks after first dose (mid-March)
      expect(result.nextDoseDate).toContain('2025-03');
    });
  });
});

describe('Action Needed - Due Now Tests', () => {
  const specialConditions: SpecialConditions = {};

  describe('MMR - Due Now', () => {
    it('should NOT set nextDoseDate for 13-month-old (past minimum age)', () => {
      const birthDate = new Date('2024-02-01');
      const currentDate = new Date('2025-03-01'); // 13 months old
      const validDoses: VaccineDoseInfo[] = [];

      const result = mmrRecommendation(
        'mmr',
        birthDate,
        currentDate,
        validDoses,
        0,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.recommendation).toContain('Give MMR dose 1 now');
      expect(result.seriesComplete).toBe(false);
    });
  });

  describe('Pneumococcal - Due Now', () => {
    it('should recommend dose now for 8-week-old (past minimum age of 6 weeks)', () => {
      const birthDate = new Date('2025-01-01');
      const currentDate = new Date('2025-03-01'); // 8 weeks old
      const validDoses: VaccineDoseInfo[] = [];

      const result = pneumococcalRecommendation(
        'pneumococcal',
        birthDate,
        currentDate,
        validDoses,
        0,
        validDoses,
        specialConditions,
        {}
      );

      expect(result.recommendation).toContain('Give PCV dose 1 now');
      expect(result.seriesComplete).toBe(false);
    });
  });
});

