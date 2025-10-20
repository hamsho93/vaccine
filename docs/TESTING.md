# Testing Guide

This guide explains how to run tests and validate CDC guideline compliance.

## Prerequisites

- Node.js 20+ (use `nvm use 20`)
- Dependencies installed (`npm ci`)

## Test Types

### 1. Unit Tests

Test individual vaccine recommendation functions.

```bash
npm test
```

**What it runs:**
- Tests in `tests/**/*.test.ts`
- Coverage thresholds: 60% for lines/functions/branches/statements
- Includes unit tests for:
  - DTaP/Tdap logic
  - MenACWY recommendations
  - Pneumococcal catch-up
  - COVID-19 decision types
  - HPV immunocompromised schedules
  - MMR/Varicella/Influenza basics
  - Vaccine name mapping
  - Zod schema validation

**Example:**
```bash
# Run specific test file
npx vitest run tests/dtap.test.ts

# Run with UI
npm run test -- --ui
```

### 2. CDC QA Scenarios

Validate end-to-end recommendation logic against CDC guidelines.

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run QA
npm run qa
```

**What it validates:**
1. DTaP dose 5 exception (≥4y and ≥6m after dose 3)
2. MenACWY single dose when starting at 16+
3. Rotavirus aged-out for 2+ years old
4. PCV catch-up 2-4y prefers single-dose PCV20
5. HPV immunocompromised uses 3-dose schedule
6. COVID-19 routine for healthy 5-11 year olds
7. IPV 4-dose series completion
8. MMR dose 2 minimum 4-week interval

**Expected output:**
```
✅ PASS - DTaP dose 5 exception at ≥4y and ≥6m after dose 3
✅ PASS - MenACWY single dose when starting at 16+
...
8/8 CDC QA scenarios passed
```

### 3. Smoke Test

Quick validation that API endpoints are working.

```bash
# Against local dev server
npm run dev
npm run smoke

# Against deployed API
API_URL=https://your-api-gateway.execute-api.region.amazonaws.com npm run smoke
```

**What it does:**
- POSTs sample vaccine data to `/api/parse-vaccine-history`
- POSTs parsed result to `/api/vaccine-catchup`
- Verifies response structure

### 4. Type Checking

Validate TypeScript types across the codebase.

```bash
npm run check
```

### 5. Linting

Check code style and common issues.

```bash
npm run lint

# Auto-fix where possible
npm run lint -- --fix
```

## CI/CD Testing

GitHub Actions runs on every PR:

```yaml
- Type check (root and backend package)
- Lint
- Build frontend
- Unit tests with coverage
```

**View CI results:**
- Check "Actions" tab in GitHub
- All checks must pass before merge

## Adding New Tests

### For a New Vaccine

1. Create unit test in `tests/`:
```typescript
import { describe, it, expect } from 'vitest';
import { yourVaccineRecommendation } from '../packages/my-shared-backend/server/services/vaccines/your_vaccine';

describe('YourVaccine logic', () => {
  it('recommends correct doses at age X', () => {
    const rec = yourVaccineRecommendation(...);
    expect(rec.recommendation).toContain('expected text');
  });
});
```

2. Add QA scenario in `scripts/qa.ts`:
```typescript
await test('YourVaccine scenario description', async () => {
  const res = await getCatchUp(birthDate, currentDate, history);
  const vaccine = res.recommendations.find(r => /yourvaccine/i.test(r.vaccineName));
  assert(!!vaccine, 'Recommendation missing');
  assert(condition, 'Expected behavior description');
});
```

3. Run tests:
```bash
npm test
npm run qa  # (with dev server running)
```

### For CDC Guideline Updates

When CDC updates their guidelines:

1. Update vaccine service file (e.g., `packages/my-shared-backend/server/services/vaccines/dtap_tdap.ts`)
2. Update or add QA test to validate the change
3. Run full test suite: `npm test && npm run qa`
4. Update `docs/CDC_ALIGNMENT.md` with the change
5. Commit with clear message referencing CDC note

## Debugging Failed Tests

### Unit Test Failures

```bash
# Run with verbose output
npx vitest run tests/yourtest.test.ts --reporter=verbose

# Debug specific test
npx vitest run tests/yourtest.test.ts --inspect-brk
```

### QA Scenario Failures

QA tests hit the actual HTTP API, so check:

1. Is dev server running? (`npm run dev` in another terminal)
2. Check server logs for errors
3. Test API manually:
```bash
curl -X POST http://localhost:8080/api/vaccine-catchup \
  -H "Content-Type: application/json" \
  -d '{"birthDate":"2010-01-01","currentDate":"2025-07-02","vaccineHistory":[]}'
```

### Coverage Failures

If coverage is below 60%:

```bash
# View coverage report
npm test
# Open coverage/lcov-report/index.html in browser
```

Add tests for uncovered lines in vaccine service files.

## Test Data

### Sample Vaccine Histories

**Complete DTaP series:**
```
DTaP 2011-01-19 2011-02-17 2011-04-07 2013-11-19 2014-11-19
```

**Incomplete series:**
```
DTaP 2020-06-26 2020-09-24 2023-06-22 2023-12-19
Hep B 2019-11-28 2020-01-15 2020-09-24
MMR 2022-05-17
```

**High-risk patient:**
```json
{
  "birthDate": "2015-01-01",
  "vaccineHistory": [...],
  "specialConditions": {
    "immunocompromised": true,
    "asplenia": false
  }
}
```

## Continuous Validation

To maintain CDC compliance:

1. Run QA before every release
2. Add QA scenario for every new vaccine
3. Update QA when CDC guidelines change
4. Keep test suite under 30 seconds for fast feedback

## Troubleshooting

**"vitest: command not found"**
- Run via npm: `npm test` instead of `vitest` directly

**"crypto.getRandomValues is not a function"**
- Ensure Node 18+ (`nvm use 20`)
- Check `tests/setup.ts` has webcrypto polyfill

**"dev server not responding"**
- Check port 8080 isn't blocked
- Look for errors in `npm run dev` output
- Try different port in vite.config.ts

---

For questions about testing, open a [GitHub Discussion](https://github.com/hamsho93/vaccine/discussions).

