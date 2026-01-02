import { describe, it, expect } from 'vitest';
import { dtapTdapRecommendation } from '../packages/my-shared-backend/server/services/vaccines/dtap_tdap';
import { VaccineDoseInfo } from '../packages/my-shared-backend/server/services/vaccine-catchup';
import { SpecialConditions } from '../packages/my-shared-backend/server/services/vaccine-cdc-rules';

describe('DTaP Dose 4 - 12 Month Old Verification', () => {
  it('should set nextDoseDate for 12-month-old child needing dose 4', () => {
    // Child born on March 1, 2024
    const birthDate = new Date('2024-03-01');
    
    // Current date: March 1, 2025 (child is exactly 12 months old)
    const currentDate = new Date('2025-03-01');
    
    // Valid doses at 2, 4, 6 months (May, July, September 2024)
    const validDoses: VaccineDoseInfo[] = [
      { date: new Date('2024-05-01') }, // 2 months
      { date: new Date('2024-07-01') }, // 4 months
      { date: new Date('2024-09-01') }  // 6 months
    ];
    
    const specialConditions: SpecialConditions = {};
    
    const result = dtapTdapRecommendation(
      'dtap_tdap',
      birthDate,
      currentDate,
      validDoses,
      3,
      validDoses,
      specialConditions,
      {}
    );
    
    // Assertions
    expect(result.seriesComplete).toBe(false);
    expect(result.nextDoseDate).toBeDefined();
    expect(result.recommendation).toContain('on or after');
    
    // The next dose date should be at 15 months (~456 days from birth using 15 * 30.44)
    // This is approximately May 30, 2025
    expect(result.nextDoseDate).toContain('2025-05');
    
    console.log('Result:', {
      recommendation: result.recommendation,
      nextDoseDate: result.nextDoseDate,
      seriesComplete: result.seriesComplete
    });
  });

  it('should recommend dose 4 now for 16-month-old child', () => {
    // Child born on November 1, 2023
    const birthDate = new Date('2023-11-01');
    
    // Current date: March 1, 2025 (child is 16 months old)
    const currentDate = new Date('2025-03-01');
    
    // Valid doses at 2, 4, 6 months
    const validDoses: VaccineDoseInfo[] = [
      { date: new Date('2024-01-01') }, // 2 months
      { date: new Date('2024-03-01') }, // 4 months
      { date: new Date('2024-05-01') }  // 6 months
    ];
    
    const specialConditions: SpecialConditions = {};
    
    const result = dtapTdapRecommendation(
      'dtap_tdap',
      birthDate,
      currentDate,
      validDoses,
      3,
      validDoses,
      specialConditions,
      {}
    );
    
    // At 16 months, dose 4 should be due NOW
    expect(result.seriesComplete).toBe(false);
    expect(result.recommendation).toContain('Give DTaP dose 4 now');
    expect(result.nextDoseDate).toBeUndefined(); // or be current/past date
    
    console.log('Result:', {
      recommendation: result.recommendation,
      nextDoseDate: result.nextDoseDate,
      seriesComplete: result.seriesComplete
    });
  });
});

