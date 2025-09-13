import { describe, it, expect } from 'vitest';
import { dtapTdapRecommendation } from '../packages/my-shared-backend/server/services/vaccines/dtap_tdap';

describe('DTaP/Tdap CDC alignment', () => {
  it('does not require DTaP dose 5 if dose 4 given at ≥4y and ≥6m after dose 3', () => {
    const birthDate = new Date('2020-01-01');
    // Doses at ~2m, 4m, 6m
    const dose1 = { date: new Date('2020-03-01') };
    const dose2 = { date: new Date('2020-05-01') };
    const dose3 = { date: new Date('2020-07-01') };
    // Dose 4 at 4y+1m, which is ≥6 months after dose 3
    const dose4 = { date: new Date('2024-02-01') };

    const rec = dtapTdapRecommendation(
      'dtap_tdap',
      birthDate,
      new Date('2025-01-01'),
      [dose1, dose2, dose3, dose4] as any,
      4,
      [dose1, dose2, dose3, dose4] as any,
      {} as any,
      {} as any
    );

    expect(rec.seriesComplete).toBe(true);
    expect(rec.recommendation.toLowerCase()).toContain('series complete');
    expect(rec.notes.join(' ')).toContain('Dose 5 not necessary');
  });

  it('for age 10 with no prior doses, marks current Tdap as counting for adolescent booster', () => {
    const birthDate = new Date('2015-01-01');
    const currentDate = new Date('2025-01-02'); // just turned 10

    const rec = dtapTdapRecommendation(
      'dtap_tdap',
      birthDate,
      currentDate,
      [] as any,
      0,
      [] as any,
      {} as any,
      {} as any
    );

    expect(rec.recommendation.toLowerCase()).toContain('tdap');
    expect(rec.notes.join(' ')).toContain('counts as adolescent Tdap booster');
    // Should not add note that adolescent booster is still needed at 11-12
    expect(rec.notes.join(' ').toLowerCase()).not.toContain('still need adolescent');
  });
});


