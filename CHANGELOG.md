# Changelog

All notable changes to VaxRecord will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-08-09

### Initial Open Source Release

VaxRecord is now open source under the MIT License!

### Features

**Core Functionality:**
- AI-powered vaccine history parsing using OpenAI GPT-4o
- CDC 2025-compliant catch-up immunization recommendations
- Support for 21 vaccines (routine, travel, and special vaccines)
- Structured and free-text input modes
- Real-time recommendation generation

**User Interface:**
- Clean, professional interface built with React + shadcn/ui
- Responsive design optimized for mobile and desktop
- Categorized recommendations (Action Needed, Complete, Shared Decision, etc.)
- CDC reference links for each vaccine
- "Try Sample Data" button for quick demos
- Export functionality (JSON, CSV)

**Clinical Features:**
- Age-specific vaccine name display (DTaP vs Tdap)
- Dose interval validation with 4-day grace period
- Series completion tracking
- Next dose date calculations
- Comprehensive clinical notes per recommendation

**Developer Experience:**
- Comprehensive test suite (13 unit tests + 8 CDC QA scenarios)
- CI/CD with GitHub Actions
- TypeScript throughout for type safety
- Automated QA validation (`npm run qa`)
- Smoke testing (`npm run smoke`)

### Documentation

- MIT LICENSE
- SECURITY.md with HIPAA guidance
- CODE_OF_CONDUCT.md
- Comprehensive README with Quick Start and FAQ
- docs/CDC_ALIGNMENT.md - CDC guideline mapping
- docs/TESTING.md - Testing guide
- docs/DEPLOYMENT.md - AWS Amplify deployment
- docs/ARCHITECTURE.md - System design
- GitHub issue and PR templates

### CDC Guideline Alignment

Fully implements CDC Child and Adolescent Immunization Schedule 2025.2 (Updated October 7, 2025):

- DTaP/Tdap: Dose 5 exception, adolescent booster logic
- MenACWY: Single dose at 16+, college catch-up through age 21
- Pneumococcal: PCV20-aware catch-up recommendations
- HPV: 3-dose schedule for immunocompromised
- COVID-19: Routine recommendations by age
- Rotavirus: Age-out enforcement (max 8 months)
- All vaccines: Minimum age, intervals, contraindications

### Testing

- 8/8 CDC QA scenarios passing
- 60%+ code coverage on vaccine logic
- Automated testing in CI
- QA script validates CDC compliance locally

### Known Limitations

- OpenAI API required for text parsing (cost: ~$0.01-0.03 per parse)
- No offline mode (requires API connectivity)
- No persistent session history
- English language only

### Contributors

- [@hamsho93](https://github.com/hamsho93) - Creator and maintainer

---

## Future Roadmap

See [GitHub Issues](https://github.com/hamsho93/vaccine/issues) for planned features:

- Photo/PDF OCR for vaccine cards
- PDF export for professional summaries
- SMART Health Card QR code scanner
- Batch processing for multiple patients
- FHIR/EHR integration
- Multi-language support

