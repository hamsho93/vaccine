import { describe, it, expect } from 'vitest';
import { meningococcalACWYRecommendation } from '../packages/my-shared-backend/server/services/vaccines/meningococcal_acwy';

describe('MenACWY 16+ catch-up', () => {
  it('requires only one dose when starting at 16+', () => {
    const birthDate = new Date('2008-01-01');
    const currentDate = new Date('2025-01-10'); // age 17
    const rec = meningococcalACWYRecommendation(
      'meningococcal_acwy',
      birthDate,
      currentDate,
      [],
      0,
      [],
      {} as any,
      {} as any
    );
    expect(rec.recommendation.toLowerCase()).toContain('give menacwy dose 1');
    expect(rec.notes.join(' ').toLowerCase()).toContain('only 1 dose');
  });
});


