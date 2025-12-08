# VaxRecord

> AI-powered vaccine history parser with CDC-compliant catch-up recommendations for healthcare professionals.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-20.x-brightgreen)](https://nodejs.org/)
[![CDC 2025.2](https://img.shields.io/badge/CDC-2025.2-blue)](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Paste unstructured vaccine records → Get structured data + CDC catch-up recommendations in one click.

## Quick Start

```bash
git clone https://github.com/hamsho93/vaccine.git
cd vaccine
npm ci
cp .env.example .env  # Add your OPENAI_API_KEY
npm run dev
# Open http://localhost:5173
```

📖 [Deployment](docs/DEPLOYMENT.md) | 🧪 [Testing](docs/TESTING.md) | 🏗️ [Architecture](docs/ARCHITECTURE.md)

## Features

- **AI Parsing:** Converts unstructured vaccine text to structured data
- **CDC 2025 Compliant:** 21 vaccines with age-specific logic and catch-up schedules
- **One-Click Workflow:** Parse + generate recommendations automatically
- **Privacy-First:** Session-based processing, no data storage
- **Mobile-Ready:** Responsive design for clinical use

## Deployment

**AWS Amplify (Recommended):**
1. Connect GitHub repo to Amplify
2. Create two apps: Frontend (root `.`) + Backend (`packages/my-shared-backend`)
3. Set environment variables:
   - Frontend: `VITE_API_URL`
   - Backend: `OPENAI_API_KEY`, `ALLOWED_ORIGIN`
4. Deploy both apps

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

**Tech Stack:** React + TypeScript + AWS Amplify Gen 2 + OpenAI GPT-4o

## Vaccine Coverage

**21 vaccines supported:** DTaP/Tdap, MMR, Varicella, Hepatitis A/B, IPV, Hib, Pneumococcal, Rotavirus, HPV, MenACWY/MenB, Influenza, COVID-19, RSV, plus travel vaccines (Dengue, Yellow Fever, Typhoid, Cholera, Japanese Encephalitis).

**CDC 2025 compliant:** Age restrictions, interval calculations, special conditions (immunocompromised, high-risk), and decision types (routine, shared decision, risk-based).

## Development

```bash
npm install
cp .env.example .env  # Add OPENAI_API_KEY
npm run dev           # Start dev server
npm test              # Run tests
npm run check         # Type check
```

**Structure:** `client/` (React frontend), `packages/my-shared-backend/` (Amplify Gen 2 backend), `shared/` (schemas), `tests/` (test suite)

## API

**POST** `/api/parse-vaccine-history` - Parse unstructured vaccine text  
**POST** `/api/vaccine-catchup` - Generate catch-up recommendations

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for details.

## Contributing

1. Fork → Create branch → Make changes → Add tests → Submit PR

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. To add a new vaccine, create a module in `packages/my-shared-backend/server/services/vaccines/` following existing patterns.

## FAQ

**HIPAA compliant?** Yes, when deployed correctly. Session-based processing, no permanent storage. See [SECURITY.md](SECURITY.md).

**How accurate?** Based on CDC 2025 guidelines with automated QA tests. See [docs/CDC_ALIGNMENT.md](docs/CDC_ALIGNMENT.md).

**Cost?** ~$15-70/month (AWS Amplify + OpenAI API) for small clinic usage.

**CDC updates?** We monitor and update. Community can report via [Issues](https://github.com/hamsho93/vaccine/issues).

## Support

- **Issues:** [GitHub Issues](https://github.com/hamsho93/vaccine/issues)
- **Questions:** [GitHub Discussions](https://github.com/hamsho93/vaccine/discussions)
- **Security:** [SECURITY.md](SECURITY.md)

## License

MIT License - free for any use. See [LICENSE](LICENSE).

---

Built for healthcare professionals. [Contributions welcome](CONTRIBUTING.md)!
