import { describe, it, expect } from 'vitest';
import { pneumococcalRecommendation } from '../packages/my-shared-backend/server/services/vaccines/pneumococcal';

describe('Pneumococcal (PCV) catch-up', () => {
  it('recommends single catch-up dose for ages 2-4 with incomplete series', () => {
    const birthDate = new Date('2021-01-01');
    const currentDate = new Date('2023-09-01'); // 2y8m
    const doses = [
      { date: new Date('2021-03-01') },
      { date: new Date('2021-05-01') },
    ];
    const rec = pneumococcalRecommendation(
      'pneumococcal',
      birthDate,
      currentDate,
      doses as any,
      doses.length,
      doses as any,
      {} as any,
      {} as any
    );
    expect(rec.recommendation.toLowerCase()).toContain('give 1 dose pcv');
  });
});


