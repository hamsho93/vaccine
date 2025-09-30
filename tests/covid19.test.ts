import { describe, it, expect } from 'vitest';
import { covid19Recommendation } from '../packages/my-shared-backend/server/services/vaccines/covid19';

describe('COVID-19 recommendation decisionType', () => {
  it('uses routine for healthy 6m-17y', () => {
    const birthDate = new Date('2015-06-01');
    const currentDate = new Date('2025-01-01');
    const rec = covid19Recommendation('covid19', birthDate, currentDate, [], 0, [], { immunocompromised: false } as any, {} as any);
    expect(rec.decisionType).toBe('routine');
  });

  it('uses routine when immunocompromised', () => {
    const birthDate = new Date('2015-06-01');
    const currentDate = new Date('2025-01-01');
    const rec = covid19Recommendation('covid19', birthDate, currentDate, [], 0, [], { immunocompromised: true } as any, {} as any);
    expect(rec.decisionType).toBe('routine');
  });
});


