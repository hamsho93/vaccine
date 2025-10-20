---
name: CDC Guideline Update
about: Report a CDC guideline change that needs implementation
title: '[CDC UPDATE] '
labels: cdc-update
assignees: ''
---

## CDC Update Details

**Date of CDC Update:** YYYY-MM-DD

**CDC Source:** [Link to CDC notes](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html)

## Affected Vaccines

Which vaccines are affected by this update?
- [ ] DTaP/Tdap
- [ ] IPV (Polio)
- [ ] MMR
- [ ] Varicella
- [ ] Hepatitis A
- [ ] Hepatitis B
- [ ] Hib
- [ ] Pneumococcal
- [ ] MenACWY
- [ ] MenB
- [ ] HPV
- [ ] Influenza
- [ ] COVID-19
- [ ] Rotavirus
- [ ] RSV
- [ ] Other: ______

## Summary of Changes

Describe what changed in CDC guidance:

## Current VaxRecord Behavior

How does VaxRecord currently handle this scenario?

## Required Updates

What needs to change in the code?

## Files to Modify

List the service files that need updates:
- `packages/my-shared-backend/server/services/vaccines/xxx.ts`
- `packages/my-shared-backend/server/services/vaccine-cdc-rules.ts`

## Testing Plan

How should we test this change?
- [ ] Add QA scenario to `scripts/qa.ts`
- [ ] Add unit test to `tests/xxx.test.ts`
- [ ] Manual testing with sample data

## Urgency

- [ ] Critical (current recommendations are incorrect)
- [ ] High (affects common scenarios)
- [ ] Medium (edge case or new vaccine)
- [ ] Low (clarification only)

## Additional Context

Any other relevant information about this CDC update.

