/*
  Standalone CDC QA validator for local testing.
  Usage: 
    1. Start dev server: npm run dev (in another terminal)
    2. Run QA: npm run qa
*/

import fetch from 'node-fetch';

type AnyJson = Record<string, any>;
type QAResult = { name: string; ok: boolean; details?: string };

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(message);
}

function getBaseUrl(): string {
  return process.env.API_URL || process.env.VITE_API_URL || 'http://localhost:8080';
}

async function postJson<T = AnyJson>(url: string, body: AnyJson): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} - ${text}`);
  }
  return (await res.json()) as T;
}

async function getCatchUp(birthDate: string, currentDate: string, history: any[], conditions: any = {}): Promise<any> {
  const base = getBaseUrl().replace(/\/$/, '');
  const url = `${base}/api/vaccine-catchup`;
  return postJson(url, { birthDate, currentDate, vaccineHistory: history, specialConditions: conditions });
}

async function run(): Promise<number> {
  const results: QAResult[] = [];

  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      results.push({ name, ok: true });
    } catch (err: any) {
      results.push({ name, ok: false, details: String(err?.message || err) });
    }
  }

  // 1) DTaP: dose 5 not required when dose 4 at ≥4y and ≥6m after dose 3
  await test('DTaP dose 5 exception at ≥4y and ≥6m after dose 3', async () => {
    const res = await getCatchUp('2010-09-21', '2015-02-01', [
      { vaccineName: 'DTaP', doses: [
        { date: '2011-01-19' },
        { date: '2011-02-17' },
        { date: '2011-04-07' },
        { date: '2014-11-19' },
      ]},
    ]);
    const rec = res.recommendations.find((r: any) => /dtap/i.test(r.vaccineName));
    assert(!!rec, 'DTaP recommendation missing');
    assert(rec.seriesComplete === true, 'DTaP series should be complete');
    const text = (rec.recommendation + ' ' + (rec.notes || []).join(' ')).toLowerCase();
    assert(/dose 5/.test(text), 'DTaP dose 5 messaging not found');
  });

  // 2) MenACWY: start at age 16 requires single dose
  await test('MenACWY single dose when starting at 16+', async () => {
    const resA = await getCatchUp('2009-01-01', '2025-07-02', []);
    const menA = resA.recommendations.find((r: any) => /men.*acwy/i.test(r.vaccineName));
    assert(!!menA, 'MenACWY recommendation missing');
    assert(/dose 1|give .* now/i.test(menA.recommendation), 'MenACWY dose 1 not recommended');

    const resB = await getCatchUp('2009-01-01', '2025-07-02', [
      { vaccineName: 'MenACWY', doses: [{ date: '2025-01-15' }] },
    ]);
    const menB = resB.recommendations.find((r: any) => /men.*acwy/i.test(r.vaccineName));
    assert(!!menB, 'MenACWY recommendation missing (with history)');
    assert(menB.seriesComplete === true, 'MenACWY should be complete with 1 dose at 16+');
  });

  // 3) Rotavirus aged-out
  await test('Rotavirus aged-out when 2+ years old', async () => {
    const res = await getCatchUp('2023-01-01', '2025-07-02', []);
    const rota = res.recommendations.find((r: any) => /rota/i.test(r.vaccineName));
    assert(!rota, 'Rotavirus should be absent (aged out)');
  });

  // 4) PCV catch-up 2–4y favors PCV20 single dose
  await test('PCV catch-up 2–4y prefers single-dose PCV20', async () => {
    const res = await getCatchUp('2022-01-01', '2025-07-02', []);
    const pcv = res.recommendations.find((r: any) => /pcv|pneumococcal/i.test(r.vaccineName));
    assert(!!pcv, 'PCV recommendation missing');
    const text = (pcv.recommendation + ' ' + (pcv.notes || []).join(' ')).toLowerCase();
    assert(/1 dose/.test(text), 'PCV should recommend 1 dose catch-up');
    assert(/pcv20/.test(text), 'PCV notes should reference PCV20');
  });

  // 5) HPV immunocompromised → 3-dose schedule
  await test('HPV immunocompromised uses 3-dose schedule', async () => {
    const res = await getCatchUp('2013-01-01', '2025-07-02', [
      { vaccineName: 'HPV', doses: [{ date: '2025-01-01' }] },
    ], { immunocompromised: true });
    const hpv = res.recommendations.find((r: any) => /hpv/i.test(r.vaccineName));
    assert(!!hpv, 'HPV recommendation missing');
    const text = (hpv.recommendation + ' ' + (hpv.notes || []).join(' ')).toLowerCase();
    assert(/3-dose/.test(text) || /dose 2/.test(text), 'HPV should indicate 3-dose path');
  });

  // 6) COVID-19 5–11 unvaccinated → 1 dose routine
  await test('COVID-19 5–11 unvaccinated → 1 dose routine', async () => {
    const res = await getCatchUp('2016-07-01', '2025-07-02', [], {});
    const covid = res.recommendations.find((r: any) => /covid/i.test(r.vaccineName));
    assert(!!covid, 'COVID-19 recommendation missing');
    assert(/give 1 dose|give .* dose/i.test(covid.recommendation), 'COVID-19 should recommend 1 dose');
    assert(covid.decisionType === 'routine', 'COVID-19 decisionType should be routine');
  });

  // 7) IPV (Polio) 4-dose series completion
  await test('IPV 4-dose series requires dose 4 at 4-6 years', async () => {
    const res = await getCatchUp('2018-01-01', '2025-07-02', [
      { vaccineName: 'IPV', doses: [
        { date: '2018-03-01' }, // 2 months
        { date: '2018-05-01' }, // 4 months
        { date: '2018-07-01' }, // 6 months
      ]},
    ]);
    const ipv = res.recommendations.find((r: any) => /polio|ipv/i.test(r.vaccineName));
    assert(!!ipv, 'IPV recommendation missing');
    assert(ipv.seriesComplete === false, 'IPV series should not be complete with only 3 doses');
    const text = (ipv.recommendation + ' ' + (ipv.notes || []).join(' ')).toLowerCase();
    assert(/dose 4|final dose/i.test(text), 'IPV should indicate dose 4 needed');
  });

  // 8) MMR dose 2 timing - minimum 4 weeks after dose 1
  await test('MMR dose 2 requires minimum 4-week interval from dose 1', async () => {
    const res = await getCatchUp('2012-01-01', '2025-07-02', [
      { vaccineName: 'MMR', doses: [
        { date: '2013-02-01' }, // First dose at 13 months
      ]},
    ]);
    const mmr = res.recommendations.find((r: any) => /mmr/i.test(r.vaccineName));
    assert(!!mmr, 'MMR recommendation missing');
    assert(mmr.seriesComplete === false, 'MMR series should not be complete with only 1 dose');
    const text = (mmr.recommendation + ' ' + (mmr.notes || []).join(' ')).toLowerCase();
    assert(/dose 2|second dose/i.test(text), 'MMR should indicate dose 2 needed');
    assert(/4 weeks|28 days/i.test(text), 'MMR notes should mention minimum interval');
  });

  // Summary output
  const failed = results.filter(r => !r.ok);
  for (const r of results) {
    // eslint-disable-next-line no-console
    console.log(`${r.ok ? '✅ PASS' : '❌ FAIL'} - ${r.name}${r.ok ? '' : `\n   ${r.details}`}`);
  }
  // eslint-disable-next-line no-console
  console.log(`\n${results.length - failed.length}/${results.length} CDC QA scenarios passed`);
  
  if (failed.length > 0) {
    // eslint-disable-next-line no-console
    console.log('\n💡 Tip: Ensure dev server is running (npm run dev) before running QA');
  }
  
  return failed.length;
}

run().then((failed) => {
  process.exit(failed === 0 ? 0 : 1);
}).catch((err) => {
  // eslint-disable-next-line no-console
  console.error('❌ QA runner error:', err.message || String(err));
  // eslint-disable-next-line no-console
  console.log('\n💡 Tip: Ensure dev server is running (npm run dev) before running QA');
  process.exit(1);
});