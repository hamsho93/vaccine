# CDC Guideline Alignment

This document explains how VaxRecord implements CDC Child and Adolescent Immunization Schedule recommendations.

## CDC Guidelines Version

**Current:** CDC 2025.2 (Updated: October 7, 2025)

**Source:** [CDC Child and Adolescent Immunization Schedule Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html)

## Vaccine-by-Vaccine Alignment

### DTaP/Tdap (Diphtheria, Tetanus, Pertussis)

**CDC Guidance:**
- 5-dose DTaP series: 2, 4, 6, 15-18 months, 4-6 years
- Dose 5 NOT needed if dose 4 given at ≥4 years AND ≥6 months after dose 3
- Tdap for catch-up starting at age 7
- Adolescent Tdap booster at 11-12 years

**Implementation:**
- File: `packages/my-shared-backend/server/services/vaccines/dtap_tdap.ts`
- Lines 76-88: Dose 5 exception logic
- Lines 23-65: Tdap catch-up and adolescent booster
- Minimum intervals: 4 weeks between doses 1-3, 6 months for doses 4-5

**QA Test:** `scripts/qa.ts` - DTaP dose 5 exception scenario

### MenACWY (Meningococcal ACWY)

**CDC Guidance:**
- Routine: 11-12 years + booster at 16 years
- Single dose if starting at ≥16 years
- College catch-up through age 21 if no dose at ≥16
- Minimum 8-week interval for booster

**Implementation:**
- File: `packages/my-shared-backend/server/services/vaccines/meningococcal_acwy.ts`
- Lines 96-128: Age 16-18 logic with single-dose start
- Lines 129-141: Age 19-21 college catch-up
- Lines 108-118: 8-week minimum interval for booster

**QA Test:** `scripts/qa.ts` - MenACWY single dose at 16+ scenario

### Pneumococcal (PCV)

**CDC Guidance:**
- 4-dose PCV series: 2, 4, 6, 12-15 months
- Catch-up ages 2-4: single dose
- PCV20 option available (may obviate PPSV23 for high-risk)

**Implementation:**
- File: `packages/my-shared-backend/server/services/vaccines/pneumococcal.ts`
- Lines 26-42: Age 2-4 catch-up with PCV20 preference
- Lines 65-75: High-risk PPSV23 logic based on PCV20 vs PCV15

**QA Test:** `scripts/qa.ts` - PCV catch-up 2-4y scenario

### Rotavirus

**CDC Guidance:**
- Maximum age to start: 14 weeks 6 days
- Maximum age for final dose: 8 months 0 days
- 2-dose (Rotarix) or 3-dose (RotaTeq) series

**Implementation:**
- File: `packages/my-shared-backend/server/services/vaccines/rotavirus.ts`
- Lines 56-78: Aged-out logic with appropriate return values
- Lines 92-99: Maximum start age enforcement
- Lines 33-46: Product-specific dosing

**QA Test:** `scripts/qa.ts` - Rotavirus aged-out scenario

### HPV (Human Papillomavirus)

**CDC Guidance:**
- 2-dose schedule if started before 15th birthday (5-month minimum interval)
- 3-dose schedule if started at ≥15 years OR immunocompromised (any age)
- Routine age: 11-12 years

**Implementation:**
- File: `packages/my-shared-backend/server/services/vaccines/hpv.ts`
- Lines 21-22: Immunocompromised persons get 3-dose schedule
- Lines 57-77: Age-specific dose recommendations
- Lines 90-92: Immunocompromised note

**QA Test:** `scripts/qa.ts` - HPV immunocompromised scenario

### COVID-19

**CDC Guidance:**
- Routine vaccination for all ≥6 months
- Age-specific primary series (2-dose Moderna, 3-dose Pfizer for young children)
- Immunocompromised: additional doses per schedule

**Implementation:**
- File: `packages/my-shared-backend/server/services/vaccines/covid19.ts`
- Lines 23-24: Immunocompromised detection
- Lines 34-62: Age-based routine recommendations
- Line 69: Decision type set to 'routine'

**QA Test:** `scripts/qa.ts` - COVID-19 routine recommendation scenario

### IPV (Inactivated Poliovirus)

**CDC Guidance:**
- 4-dose series: 2, 4, 6-18 months, 4-6 years
- Dose 4 must be at ≥4 years AND ≥6 months after dose 3

**Implementation:**
- File: `packages/my-shared-backend/server/services/vaccines/ipv.ts`
- Lines 54-65: Dose 4 timing with age and interval requirements

**QA Test:** `scripts/qa.ts` - IPV 4-dose series scenario

### MMR (Measles, Mumps, Rubella)

**CDC Guidance:**
- 2-dose series: 12-15 months and 4-6 years
- Minimum 4-week interval between doses

**Implementation:**
- File: `packages/my-shared-backend/server/services/vaccines/mmr.ts`
- Lines 19-22: Dose requirements and minimum intervals
- Lines 43-52: Dose 2 timing with 4-week minimum

**QA Test:** `scripts/qa.ts` - MMR dose 2 interval scenario

## Testing CDC Compliance

### Automated QA

Run comprehensive CDC scenario tests:

```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Run QA validation
npm run qa
```

### Manual Verification

For each vaccine update:
1. Check CDC notes page for the latest guidance
2. Update vaccine service file
3. Add or update QA test scenario
4. Run `npm run qa` to verify
5. Commit with reference to CDC note section

## CDC Update Process

When CDC updates their guidelines:

1. **Detection**: GitHub Action monitors CDC website daily (planned)
2. **Review**: Maintainer reviews changes and opens issue
3. **Implementation**: Update affected vaccine service files
4. **Testing**: Add/update QA scenarios
5. **Validation**: Run full QA suite
6. **Release**: Tag new version (e.g., v1.1.0) with CDC update notes

## Deviations from CDC

None currently. All recommendations follow CDC 2025 guidelines exactly.

If a clinical decision requires deviation, it will be documented here with rationale.

## References

- [CDC Child & Adolescent Immunization Schedule](https://www.cdc.gov/vaccines/schedules/hcp/imz/child-adolescent.html)
- [CDC Schedule Notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html)
- [CDC Catch-Up Schedule](https://www.cdc.gov/vaccines/schedules/hcp/imz/catchup.html)

Last Updated: 2025-12-08

