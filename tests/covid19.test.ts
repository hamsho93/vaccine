import { describe, it, expect } from 'vitest';
import { covid19Recommendation } from '../packages/my-shared-backend/server/services/vaccines/covid19';

describe('COVID-19 recommendation decisionType', () => {
  // CDC 2025: COVID-19 vaccination uses shared clinical decision-making
  // Risk-benefit is most favorable for individuals at increased risk for severe COVID-19
  
  it('uses shared-clinical-decision for healthy 6m-17y per CDC 2025', () => {
    const birthDate = new Date('2015-06-01');
    const currentDate = new Date('2025-01-01');
    const rec = covid19Recommendation('covid19', birthDate, currentDate, [], 0, [], { immunocompromised: false } as any, {} as any);
    expect(rec.decisionType).toBe('shared-clinical-decision');
  });

  it('uses shared-clinical-decision when immunocompromised per CDC 2025', () => {
    const birthDate = new Date('2015-06-01');
    const currentDate = new Date('2025-01-01');
    const rec = covid19Recommendation('covid19', birthDate, currentDate, [], 0, [], { immunocompromised: true } as any, {} as any);
    expect(rec.decisionType).toBe('shared-clinical-decision');
  });
});


