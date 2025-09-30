import { describe, it, expect } from 'vitest';
import { VaccineCatchUpService } from '../../packages/my-shared-backend/server/services/vaccine-catchup';
import { vaccineNameMapper } from '../../packages/my-shared-backend/server/services/vaccine-name-mapper';

function d(s: string): Date {
  return new Date(s);
}

describe('CDC QA scenarios', () => {
  const service = new VaccineCatchUpService();

  it('DTaP: dose 5 not required when dose 4 at ≥4y and ≥6m after dose 3', async () => {
    const birthDate = '2010-09-21';
    const currentDate = '2015-02-01';
    const request = {
      birthDate,
      currentDate,
      vaccineHistory: [
        {
          vaccineName: 'DTaP',
          doses: [
            { date: '2011-01-19' },
            { date: '2011-02-17' },
            { date: '2011-04-07' },
            { date: '2014-11-19' },
          ],
        },
      ],
      specialConditions: {},
    } as any;

    const res = await service.generateCatchUpRecommendations(request);
    const dtap = res.recommendations.find(r => /dtap/i.test(r.vaccineName));
    expect(dtap).toBeDefined();
    expect(dtap!.seriesComplete).toBe(true);
    expect(dtap!.recommendation.toLowerCase()).toContain('dose 5');
    expect(dtap!.recommendation.toLowerCase()).toContain('not needed');
  });

  it('MenACWY: start at age 16 requires single dose; prior dose at 16+ is complete', async () => {
    const birthDate = '2009-01-01';
    const currentDate = '2025-07-02';

    // a) No history at 16 → recommend 1st dose now
    const reqA = { birthDate, currentDate, vaccineHistory: [], specialConditions: {} } as any;
    const resA = await service.generateCatchUpRecommendations(reqA);
    const menA = resA.recommendations.find(r => vaccineNameMapper.toInternal(r.vaccineName) === 'meningococcal_acwy');
    expect(menA).toBeDefined();
    expect(menA!.recommendation.toLowerCase()).toContain('dose 1');

    // b) One dose given at 16 → complete
    const reqB = {
      birthDate, currentDate,
      vaccineHistory: [
        { vaccineName: 'MenACWY', doses: [{ date: '2025-01-15' }] },
      ],
      specialConditions: {},
    } as any;
    const resB = await service.generateCatchUpRecommendations(reqB);
    const menB = resB.recommendations.find(r => vaccineNameMapper.toInternal(r.vaccineName) === 'meningococcal_acwy');
    expect(menB).toBeDefined();
    expect(menB!.seriesComplete).toBe(true);
  });

  it('Rotavirus: aged-out with no history should not produce a recommendation', async () => {
    const birthDate = '2023-01-01'; // 2+ years old
    const currentDate = '2025-07-02';
    const req = { birthDate, currentDate, vaccineHistory: [], specialConditions: {} } as any;
    const res = await service.generateCatchUpRecommendations(req);
    const rota = res.recommendations.find(r => /rota/i.test(r.vaccineName));
    expect(rota).toBeUndefined();
  });

  it('PCV catch-up 2–4y: prefer single-dose PCV20 completes series', async () => {
    const birthDate = '2022-01-01'; // age 3 years
    const currentDate = '2025-07-02';
    const req = { birthDate, currentDate, vaccineHistory: [], specialConditions: {} } as any;
    const res = await service.generateCatchUpRecommendations(req);
    const pcv = res.recommendations.find(r => /pcv|pneumococcal/i.test(r.vaccineName));
    expect(pcv).toBeDefined();
    expect(pcv!.recommendation.toLowerCase()).toContain('1 dose');
    expect(pcv!.notes.join(' ').toLowerCase()).toContain('pcv20');
  });

  it('HPV immunocompromised: use 3-dose schedule regardless of age', async () => {
    const birthDate = '2013-01-01'; // 12 years
    const currentDate = '2025-07-02';
    const req = {
      birthDate, currentDate,
      vaccineHistory: [ { vaccineName: 'HPV', doses: [{ date: '2025-01-01' }] } ],
      specialConditions: { immunocompromised: true },
    } as any;
    const res = await service.generateCatchUpRecommendations(req);
    const hpv = res.recommendations.find(r => /hpv/i.test(r.vaccineName));
    expect(hpv).toBeDefined();
    expect(hpv!.notes.join(' ').toLowerCase()).toContain('3-dose');
    expect(hpv!.recommendation.toLowerCase()).toContain('dose 2');
  });

  it('COVID-19 ages 5–11: routine one dose now if unvaccinated', async () => {
    const birthDate = '2016-07-01'; // age 9
    const currentDate = '2025-07-02';
    const req = { birthDate, currentDate, vaccineHistory: [], specialConditions: {} } as any;
    const res = await service.generateCatchUpRecommendations(req);
    const covid = res.recommendations.find(r => /covid/i.test(r.vaccineName));
    expect(covid).toBeDefined();
    expect(covid!.recommendation.toLowerCase()).toContain('give 1 dose');
    expect(covid!.decisionType).toBe('routine');
  });
});



