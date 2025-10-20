import { describe, it, expect } from 'vitest';
import { hepatitisBRecommendation } from '../packages/my-shared-backend/server/services/vaccines/hepatitis_b';
import { hepaRecommendation } from '../packages/my-shared-backend/server/services/vaccines/hepa';

describe('Hepatitis B vaccine logic', () => {
  it('requires 3-dose series with specific intervals', () => {
    const birthDate = new Date('2024-01-01');
    const currentDate = new Date('2024-06-01'); // 5 months
    const doses = [
      { date: new Date('2024-01-02') }, // Birth
      { date: new Date('2024-02-01') }, // 1 month
    ];
    
    const rec = hepatitisBRecommendation(
      'hepatitis_b',
      birthDate,
      currentDate,
      doses as any,
      doses.length,
      doses as any,
      {} as any,
      {} as any
    );
    
    expect(rec.recommendation.toLowerCase()).toContain('dose 3');
    expect(rec.seriesComplete).toBe(false);
  });

  it('completes series with 3 doses', () => {
    const birthDate = new Date('2023-01-01');
    const currentDate = new Date('2024-01-01');
    const doses = [
      { date: new Date('2023-01-02') },
      { date: new Date('2023-02-01') },
      { date: new Date('2023-07-01') },
    ];
    
    const rec = hepatitisBRecommendation(
      'hepatitis_b',
      birthDate,
      currentDate,
      doses as any,
      doses.length,
      doses as any,
      {} as any,
      {} as any
    );
    
    expect(rec.recommendation.toLowerCase()).toContain('complete');
    expect(rec.seriesComplete).toBe(true);
  });
});

describe('Hepatitis A vaccine logic', () => {
  it('recommends dose 1 at 12+ months', () => {
    const birthDate = new Date('2023-01-01');
    const currentDate = new Date('2024-02-01'); // 13 months
    
    const rec = hepaRecommendation(
      'hepatitis_a',
      birthDate,
      currentDate,
      [] as any,
      0,
      [] as any,
      {} as any,
      {} as any
    );
    
    expect(rec.recommendation.toLowerCase()).toContain('dose 1');
    expect(rec.seriesComplete).toBe(false);
  });

  it('requires minimum 6-month interval between doses', () => {
    const birthDate = new Date('2023-01-01');
    const currentDate = new Date('2024-09-01');
    const doses = [{ date: new Date('2024-02-01') }];
    
    const rec = hepaRecommendation(
      'hepatitis_a',
      birthDate,
      currentDate,
      doses as any,
      doses.length,
      doses as any,
      {} as any,
      {} as any
    );
    
    expect(rec.recommendation.toLowerCase()).toContain('dose 2');
    const notesText = rec.notes.join(' ').toLowerCase();
    expect(notesText).toContain('6 month');
  });
});

