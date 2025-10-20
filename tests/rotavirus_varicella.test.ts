import { describe, it, expect } from 'vitest';
import { rotavirusRecommendation } from '../packages/my-shared-backend/server/services/vaccines/rotavirus';
import { varicellaRecommendation } from '../packages/my-shared-backend/server/services/vaccines/varicella';

describe('Rotavirus vaccine logic', () => {
  it('returns null (age-ineligible) when patient is too old and never started', () => {
    const birthDate = new Date('2022-01-01');
    const currentDate = new Date('2024-06-01'); // 2.5 years
    
    const rec = rotavirusRecommendation(
      'rotavirus',
      birthDate,
      currentDate,
      [] as any,
      0,
      [] as any,
      {} as any,
      {} as any
    );
    
    expect(rec).toBeNull();
  });

  it('returns aged-out when series started but patient is now too old', () => {
    const birthDate = new Date('2023-01-01');
    const currentDate = new Date('2024-01-01'); // 12 months (too old for completion)
    const doses = [{ date: new Date('2023-03-01') }];
    
    const rec = rotavirusRecommendation(
      'rotavirus',
      birthDate,
      currentDate,
      doses as any,
      doses.length,
      doses as any,
      {} as any,
      {} as any
    );
    
    expect(rec).not.toBeNull();
    expect(rec!.decisionType).toBe('aged-out');
    expect(rec!.recommendation.toLowerCase()).toContain('aged out');
  });

  it('handles 2-dose Rotarix series', () => {
    const birthDate = new Date('2024-01-01');
    const currentDate = new Date('2024-04-01'); // 3 months
    const doses = [{ date: new Date('2024-03-01'), product: 'Rotarix' }];
    
    const rec = rotavirusRecommendation(
      'rotavirus',
      birthDate,
      currentDate,
      doses as any,
      doses.length,
      doses as any,
      {} as any,
      {} as any
    );
    
    expect(rec).not.toBeNull();
    expect(rec!.recommendation.toLowerCase()).toContain('dose 2');
    const notesText = rec!.notes.join(' ');
    expect(notesText).toContain('Rotarix');
  });
});

describe('Varicella vaccine logic', () => {
  it('uses 3-month interval for children under 13', () => {
    const birthDate = new Date('2020-01-01');
    const currentDate = new Date('2021-06-01'); // 17 months
    const doses = [{ date: new Date('2021-02-01') }];
    
    const rec = varicellaRecommendation(
      'varicella',
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
    expect(notesText).toContain('3 month');
  });

  it('uses 4-week interval for adolescents 13+', () => {
    const birthDate = new Date('2010-01-01');
    const currentDate = new Date('2024-01-01'); // 14 years
    const doses = [{ date: new Date('2023-12-01') }];
    
    const rec = varicellaRecommendation(
      'varicella',
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
    expect(notesText).toContain('4 week');
  });
});

