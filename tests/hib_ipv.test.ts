import { describe, it, expect } from 'vitest';
import { hibRecommendation } from '../packages/my-shared-backend/server/services/vaccines/hib';
import { ipvRecommendation } from '../packages/my-shared-backend/server/services/vaccines/ipv';

describe('Hib vaccine logic', () => {
  it('completes series for healthy children at 5 years', () => {
    const birthDate = new Date('2019-01-01');
    const currentDate = new Date('2024-06-01'); // 5+ years
    
    const rec = hibRecommendation(
      'hib',
      birthDate,
      currentDate,
      [] as any,
      0,
      [] as any,
      {} as any,
      {} as any
    );
    
    expect(rec.recommendation.toLowerCase()).toContain('not routinely recommended');
    expect(rec.seriesComplete).toBe(true);
  });

  it('recommends vaccine for high-risk children over 5', () => {
    const birthDate = new Date('2018-01-01');
    const currentDate = new Date('2024-01-01'); // 6 years
    
    const rec = hibRecommendation(
      'hib',
      birthDate,
      currentDate,
      [] as any,
      0,
      [] as any,
      { asplenia: true } as any,
      {} as any
    );
    
    expect(rec.recommendation.toLowerCase()).toContain('consider hib');
    expect(rec.seriesComplete).toBe(false);
  });
});

describe('IPV (Polio) vaccine logic', () => {
  it('requires dose 4 at age 4+ years AND 6 months after dose 3', () => {
    const birthDate = new Date('2020-01-01');
    const currentDate = new Date('2024-06-01'); // 4.5 years
    const doses = [
      { date: new Date('2020-03-01') },
      { date: new Date('2020-05-01') },
      { date: new Date('2020-07-01') },
    ];
    
    const rec = ipvRecommendation(
      'ipv',
      birthDate,
      currentDate,
      doses as any,
      doses.length,
      doses as any,
      {} as any,
      {} as any
    );
    
    expect(rec.recommendation.toLowerCase()).toContain('dose 4');
    const notesText = rec.notes.join(' ').toLowerCase();
    expect(notesText).toContain('4+ years');
    expect(notesText).toContain('6 months');
  });

  it('completes series with 4 doses', () => {
    const birthDate = new Date('2019-01-01');
    const currentDate = new Date('2024-01-01');
    const doses = [
      { date: new Date('2019-03-01') },
      { date: new Date('2019-05-01') },
      { date: new Date('2019-07-01') },
      { date: new Date('2023-06-01') },
    ];
    
    const rec = ipvRecommendation(
      'ipv',
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

