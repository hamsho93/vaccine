/*
  Simple smoke test for the public API.
  Usage:
    API_URL=https://<api-id>.execute-api.<region>.amazonaws.com npm run smoke
    or
    npm run smoke -- --url https://<api-id>.execute-api.<region>.amazonaws.com
*/

import fetch from 'node-fetch';

type AnyJson = Record<string, any>;

const DEFAULT_API = 'https://76hqbcmos7.execute-api.us-east-1.amazonaws.com';

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const arg = process.argv.find(a => a.startsWith(prefix));
  return arg ? arg.slice(prefix.length) : undefined;
}

function getBaseUrl(): string {
  return (
    getArg('url') ||
    process.env.API_URL ||
    process.env.VITE_API_URL ||
    DEFAULT_API
  );
}

async function postJson<T = AnyJson>(url: string, body: AnyJson, timeoutMs = 15000): Promise<T> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(id);
  }
}

async function main() {
  const base = getBaseUrl().replace(/\/$/, '');
  const parseUrl = `${base}/api/parse-vaccine-history`;
  const catchupUrl = `${base}/api/vaccine-catchup`;

  // Minimal realistic sample
  const birthDate = '2010-09-21';
  const vaccineData = [
    'DTaP 2011-01-19 2011-02-17 2011-04-07 2013-11-19 2014-11-19',
    'Polio 2011-01-19 2011-02-17 2013-11-19 2014-11-19',
    'MMR 2012-08-20 2017-08-29',
  ].join('\n');

  console.log(`▶️  Smoke: POST ${parseUrl}`);
  const parsed = await postJson<any>(parseUrl, { vaccineData, birthDate });
  if (!parsed || !Array.isArray(parsed.vaccines)) {
    throw new Error('Parse response missing vaccines[]');
  }
  console.log(`✅ Parse OK: ${parsed.vaccines.length} series`);

  const history = parsed.vaccines.map((v: any) => ({
    vaccineName: v.standardName,
    doses: (v.doses || []).map((d: any) => ({ date: d.date })),
  }));

  const catchUpRequest = {
    birthDate: parsed.patientInfo?.dateOfBirth || birthDate,
    currentDate: new Date().toISOString().slice(0, 10),
    vaccineHistory: history,
    specialConditions: {},
  };

  console.log(`▶️  Smoke: POST ${catchupUrl}`);
  const catchup = await postJson<any>(catchupUrl, catchUpRequest);
  if (!catchup || !Array.isArray(catchup.recommendations)) {
    throw new Error('Catch-up response missing recommendations[]');
  }
  console.log(`✅ Catch-up OK: ${catchup.recommendations.length} recommendations`);

  console.log('🎉 Smoke test PASS');
}

main().catch(err => {
  console.error('❌ Smoke test FAIL');
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});


