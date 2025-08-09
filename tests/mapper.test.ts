import { describe, it, expect } from 'vitest';
import { vaccineNameMapper } from '../packages/my-shared-backend/server/services/vaccine-name-mapper';

describe('vaccineNameMapper', () => {
  it('normalizes DTaP synonyms to internal code', () => {
    expect(vaccineNameMapper.toInternal('DTaP')).toBe('dtap_tdap');
    expect(vaccineNameMapper.toInternal('tetanus diphtheria pertussis')).toBe('dtap_tdap');
  });

  it('returns age-specific display name', () => {
    expect(vaccineNameMapper.getAgeSpecificDisplay('dtap_tdap', 4)).toContain('DTaP');
    expect(vaccineNameMapper.getAgeSpecificDisplay('dtap_tdap', 12)).toContain('Tdap');
  });
});


