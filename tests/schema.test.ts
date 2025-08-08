import { describe, it, expect } from 'vitest';
import { VaccineDose, VaccineHistoryResult } from '../shared/schema';

describe('Zod schemas', () => {
  it('parses a valid VaccineDose', () => {
    const input = { date: '2020-01-15', patientAge: '12 months' };
    const parsed = VaccineDose.parse(input);
    expect(parsed.date).toBe('2020-01-15');
  });

  it('parses a minimal VaccineHistoryResult shape', () => {
    const nowIso = new Date().toISOString();
    const input = {
      patientInfo: { dateOfBirth: '2019-09-21', currentAge: '5 years', totalVaccines: 1 },
      vaccines: [
        {
          vaccineName: 'MMR',
          standardName: 'Measles, Mumps, Rubella',
          doses: [{ date: '2020-01-15', patientAge: '12 months' }],
          seriesStatus: 'Incomplete',
        },
      ],
      processingNotes: [],
      cdcVersion: '2025.1',
      processedAt: nowIso,
    };
    const parsed = VaccineHistoryResult.parse(input);
    expect(parsed.vaccines.length).toBe(1);
  });
});


