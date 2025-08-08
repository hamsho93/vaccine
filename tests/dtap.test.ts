import { describe, it, expect } from 'vitest';
import { dtapTdapRecommendation } from '../packages/my-shared-backend/server/services/vaccines/dtap_tdap';

describe('DTaP catch-up intervals', () => {
  it('recommends dose 5 at age 4-6 years when 4 doses completed', () => {
    const birthDate = new Date('2020-01-01');
    const currentDate = new Date('2025-01-01'); // 5 years
    const doses = [
      { date: new Date('2020-03-01') },
      { date: new Date('2020-05-01') },
      { date: new Date('2020-07-01') },
      { date: new Date('2021-06-01') },
    ];
    const rec = dtapTdapRecommendation(
      'dtap_tdap',
      birthDate,
      currentDate,
      doses as any,
      doses.length,
      doses as any,
      {} as any,
      {} as any
    );
    expect(rec.recommendation.toLowerCase()).toContain('dose 5');
  });
});


