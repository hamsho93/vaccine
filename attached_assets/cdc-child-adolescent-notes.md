# CDC Child Immunization Schedule Notes
## Recommendations for Ages 18 Years or Younger, United States, 2025

### Key Implementation Rules:
1. **Interval Calculations**: 4 weeks = 28 days. Intervals of ≥4 months are determined by calendar months.
2. **Grace Period**: Vaccine doses administered ≤4 days before the minimum age or interval are considered valid.
3. **Early Doses**: Doses administered ≥5 days earlier than minimum age/interval should be repeated.
4. **Special Populations**: Immunocompromised individuals have different schedules.

### COVID-19 Vaccination Guidelines:
- **Minimum age**: 6 months (Moderna/Pfizer), 12 years (Novavax)
- **Shared clinical decision-making**: Ages 6 months-17 years (not immunocompromised)
- **Routine vaccination**: Age 18 years

### Implementation needed:
1. Grace period logic (≤4 days early = valid)
2. Early dose detection and repeat recommendations
3. Immunocompromised status handling
4. Shared clinical decision-making flags
5. Contraindications and precautions checking