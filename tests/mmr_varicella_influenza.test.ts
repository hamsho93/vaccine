import { describe, it, expect } from 'vitest';
import { mmrRecommendation } from '../packages/my-shared-backend/server/services/vaccines/mmr';
import { varicellaRecommendation } from '../packages/my-shared-backend/server/services/vaccines/varicella';
import { influenzaRecommendation } from '../packages/my-shared-backend/server/services/vaccines/influenza';

describe('MMR/Varicella/Influenza basics', () => {
  it('MMR: second dose due 4+ weeks after first', () => {
    const birthDate = new Date('2023-01-01');
    const dose1 = new Date('2024-02-01');
    const currentDate = new Date('2024-03-05'); // > 4 weeks later
    const rec = mmrRecommendation('mmr', birthDate, currentDate, [{ date: dose1 }] as any, 1, [{ date: dose1 }] as any, {} as any, {} as any);
    expect(rec.recommendation.toLowerCase()).toContain('dose 2');
  });

  it('Varicella: first dose not before 12 months', () => {
    const birthDate = new Date('2024-01-01');
    const currentDate = new Date('2024-08-01'); // 7 months
    const rec = varicellaRecommendation('varicella', birthDate, currentDate, [], 0, [], {} as any, {} as any);
    expect(rec.recommendation.toLowerCase()).toContain('on or after');
  });

  it('Influenza: recommends vaccine when doses = 0 (basic path)', () => {
    const birthDate = new Date('2020-01-01');
    const currentDate = new Date('2025-10-01');
    const rec = influenzaRecommendation('influenza', birthDate, currentDate, [], 0, [], {} as any, {} as any);
    expect(rec.vaccineName).toBe('influenza');
  });
});


