# VaxRecord - AI-Powered Vaccine History Parser & CDC Catch-Up Recommendations

> Open source, CDC-compliant vaccine history parsing and immunization recommendation system for healthcare professionals.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-20.x-brightgreen)](https://nodejs.org/)
[![CDC 2025.1](https://img.shields.io/badge/CDC-2025.1-blue)](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

Converts unstructured vaccine records into structured data with AI-powered parsing and provides real-time CDC catch-up immunization recommendations.

## Quick Start

```bash
# Clone repository
git clone https://github.com/hamsho93/vaccine.git
cd vaccine

# Install dependencies
npm ci

# Set up environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start development server
npm run dev
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080

# Run QA validation
npm run qa  # In another terminal
```

[📖 Full deployment guide](docs/DEPLOYMENT.md) | [🧪 Testing guide](docs/TESTING.md) | [🏗️ Architecture](docs/ARCHITECTURE.md)

## Screenshots

<!-- TODO: Add screenshots before public launch -->
<!-- 
Suggested screenshots:
1. Main input page with sample vaccine history
2. Parsed vaccine table showing structured data
3. Recommendations tab with Action Needed vaccines
4. Individual vaccine recommendation card with CDC reference link
-->

*Screenshots coming soon. The app is fully functional - try it locally with `npm run dev`*

## 🌟 Key Features

- 🧠 **AI-Powered Parsing:** Uses OpenAI GPT-4o to convert unstructured vaccine records to structured data
- 📋 **CDC 2025 Compliance:** Fully aligned with Child & Adolescent Immunization Schedule Notes
- 🎯 **Smart Categorization:** 
  - Action Needed (incomplete series)
  - Complete (up-to-date)
  - Shared Clinical Decision (COVID-19, etc.)
  - Risk-Based (high-risk patients only)
  - International Advisory (travel vaccines)
  - Aged Out (past age limits)
- 📱 **Responsive Design:** Mobile-optimized interface for clinical use
- 🔒 **Privacy-First:** No permanent patient data storage
- ⚡ **Real-Time:** Instant recommendations with progress tracking
- 🏥 **Clinical Grade:** Built for healthcare professional workflows

## 🚀 AWS Amplify Deployment (Monorepo: Frontend + Gen 2 Backend)

### Prerequisites

1. **AWS Account** with Amplify access
2. **GitHub Repository** containing this code
3. **Environment Variables** for frontend and backend
4. **OpenAI API Key** for vaccine parsing (backend)

### Required Environment Variables

Configure these in **AWS Amplify Console → App Settings → Environment Variables** for each Amplify app:

Frontend app (appRoot `.`):

```bash
# Frontend
VITE_API_URL=https://<your-api-gateway-id>.execute-api.<region>.amazonaws.com
```

Backend app (appRoot `packages/my-shared-backend`):

```bash
# Backend
OPENAI_API_KEY=sk-...                # required for parsing
ALLOWED_ORIGIN=https://<your-amplify-frontend-domain>  # strict CORS
NODE_OPTIONS=--enable-source-maps     # optional, better error stacks
```

### One-click Amplify Setup (Monorepo)

#### 1) Connect repository once (Monorepo mode)
- Amplify reads root `amplify.yml` with two applications:
  - Frontend (appRoot `.`) – static hosting of Vite build
  - Backend (appRoot `packages/my-shared-backend`) – Amplify Gen 2 API (Lambda + API Gateway)

#### 2) Configure environment variables
- Frontend app: set `VITE_API_URL`
- Backend app: set `OPENAI_API_KEY`, `ALLOWED_ORIGIN`

#### 3) Deploy
- Click “Save and deploy” for both apps
- After backend deploys, verify `/api/health` responds 200
- Frontend should call the API via `VITE_API_URL`

#### 4) Update releases
- Push to `main` → CI runs (type-check, lint, build, tests)
- Amplify auto-builds both apps per `amplify.yml`

### Architecture Overview

```
┌─────────────────┐        ┌──────────────────────────────┐
│   React Client  │  HTTPS │  API Gateway (HTTP API v2)   │
│  (Vite + TS)    │ ─────▶ │  → Lambda (Gen 2 handler)    │
└─────────────────┘        └──────────────────────────────┘
         │                                  │
         ▼                                  ▼
  shadcn/ui + Tailwind                 OpenAI (parsing)
```

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Amplify Gen 2 (Lambda + API Gateway, TypeScript)
- **AI:** OpenAI GPT-4o for vaccine parsing
- **Validation:** Zod schemas for type safety
- **Testing:** Vitest + jsdom

## 🏥 Clinical Features

### Vaccine Coverage
**Routine Childhood Vaccines (CDC 2025):**
- Hepatitis B, DTaP/Tdap, Hib, Pneumococcal (PCV)
- IPV (Polio), MMR, Varicella, Hepatitis A
- Rotavirus, Influenza (annual), COVID-19
- HPV, Meningococcal ACWY/B, RSV

**Travel & Special Vaccines:**
- Dengue, Japanese Encephalitis, Yellow Fever
- Typhoid, Cholera (International Advisory)

### CDC Compliance Features
- **Age-Specific Logic:** Proper age restrictions and catch-up schedules
- **Interval Calculations:** Minimum intervals between doses
- **Special Conditions:** Immunocompromised, high-risk patients
- **Decision Types:** Routine, catch-up, shared decision, risk-based
- **Contraindications:** Age limits, medical conditions

### Smart Recommendations
- **Series Completion Tracking:** Normal vs catch-up schedule detection
- **Next Dose Scheduling:** Precise date calculations
- **Clinical Notes:** Comprehensive explanations for each recommendation
- **Progress Visualization:** Multi-dose series progress bars

## 🛠️ Local Development

### Setup
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your development values:
# DATABASE_URL=your-local-or-neon-database-url
# OPENAI_API_KEY=your-openai-api-key
# NODE_ENV=development
# PORT=8080

# Run database migrations
npm run db:push

# Start development server
npm run dev
# Frontend: http://localhost:5173
# Backend API: http://localhost:8080
```

### Development Commands
```bash
# Development server (with hot reload)
npm run dev

# Run tests
npm test

# Type checking
npm run check

# Production build
npm run build

# Start production server
npm start

# Database operations
npm run db:push  # Apply schema changes
```

### Project Structure
```
VaxRecord/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # shadcn/ui components
│   │   ├── pages/          # Application pages
│   │   └── lib/            # Utilities, queries
├── packages/my-shared-backend/   # Amplify Gen 2 backend (API, functions)
│   ├── amplify/                  # Gen 2 infra (api, auth, data, functions)
│   └── server/                   # Business logic and shared services
├── shared/                 # Shared types/schemas
│   └── schema.ts           # Zod validation schemas
├── tests/                  # Test files
├── amplify.yml             # AWS Amplify build config
└── package.json            # Dependencies & scripts
```

## 📋 API Reference

### Core Endpoints

Base URL: `${VITE_API_URL}`

1) Parse vaccine history
```
POST /api/parse-vaccine-history
{
  "vaccineData": "string",
  "birthDate": "YYYY-MM-DD"
}
```

2) Generate catch-up
```
POST /api/vaccine-catchup
{
  "birthDate": "YYYY-MM-DD",
  "vaccineHistory": { /* parsed result from step 1 */ }
}
```

## 🔐 Security & Privacy

### Data Protection
- **No Permanent Storage:** Patient data is not retained after session
- **Secure Transmission:** All API calls use HTTPS
- **Environment Variables:** Sensitive configuration stored securely
- **Database Encryption:** Neon PostgreSQL provides encryption at rest

### Production Security
- **API Key Rotation:** Regularly rotate OpenAI API keys
- **Database Access:** Use read-only database users where possible
- **Environment Isolation:** Separate development and production environments
- **Access Logging:** Monitor AWS Amplify access logs

## 🚨 Troubleshooting

### Common Deployment Issues

**Build Failures:**
```bash
# Check Node.js version (requires v18+)
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Test build locally
npm run build
```

**Database Connection Issues:**
```bash
# Test database connectivity
npm run db:push

# Verify environment variables
echo $DATABASE_URL
```

**OpenAI API Issues:**
- Verify API key is valid and has credits
- Check rate limits and usage quotas
- Test API key: `curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models`

### AWS Amplify Specific

**Build Logs:**
- Access via Amplify Console → App → Build History
- Look for environment variable issues
- Check Node.js version compatibility

**Environment Variables:**
- Ensure all variables are set in Amplify Console
- No extra spaces or quotes
- Use production database URL

**Performance:**
- Monitor Amplify build times (~5-10 minutes expected)
- Check database response times
- Review OpenAI API latency

## 📈 Monitoring & Analytics

### Key Metrics to Monitor
- **Build Success Rate:** AWS Amplify deployment success
- **API Response Times:** Backend performance
- **Database Connections:** Connection pool usage
- **OpenAI API Usage:** Token consumption and costs
- **Error Rates:** Application and API errors

### AWS CloudWatch Integration
- Amplify automatically provides basic metrics
- Set up custom alarms for critical thresholds
- Monitor database connection errors

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/vaccine-logic-update`
3. Make changes following CDC guidelines
4. Add tests for new functionality
5. Run full test suite: `npm test`
6. Submit pull request with detailed description

### Adding New Vaccines
1. Create new module in `server/services/vaccines/`
2. Follow existing patterns for consistency
3. Add to `vaccine-catchup.ts` switch statement
4. Add to `vaccine-name-mapper.ts`
5. Include comprehensive CDC-compliant logic
6. Add appropriate tests

## ❓ FAQ

### Is this HIPAA compliant?

Yes, when deployed correctly. VaxRecord:
- Processes data in-memory only (no database storage)
- Uses session-based processing (data cleared after session)
- Supports HTTPS-only deployment
- See [SECURITY.md](SECURITY.md) for HIPAA deployment checklist

### How accurate are the recommendations?

Recommendations are based directly on CDC 2025 guidelines with:
- 8 automated QA scenarios validating key CDC rules
- Unit tests for vaccine-specific logic
- Regular updates when CDC guidelines change
- See [docs/CDC_ALIGNMENT.md](docs/CDC_ALIGNMENT.md) for details

### What if CDC updates their guidelines?

We monitor CDC guidelines and update the app accordingly:
- GitHub Action checks CDC website daily (coming soon)
- Community can report updates via issues
- See [Contributing Guide](CONTRIBUTING.md) for CDC update process

### Can I use this for my clinic?

Yes! VaxRecord is open source under MIT license:
- Free for any use, including commercial
- Deploy your own instance or use hosted version
- Customize for your workflow
- See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### How much does it cost to run?

For a small clinic (self-hosted on AWS):
- AWS Amplify: ~$5-20/month (hosting + builds)
- OpenAI API: ~$10-50/month (depends on usage)
- Total: ~$15-70/month
- First-time setup: ~2 hours

### Can I contribute?

Absolutely! We welcome contributions:
- Report bugs via [Issues](https://github.com/hamsho93/vaccine/issues)
- Submit PRs for features or fixes
- Improve documentation
- Add test coverage
- See [CONTRIBUTING.md](CONTRIBUTING.md)

### How do I report a security issue?

Please email security issues privately (do not open public issues).
See [SECURITY.md](SECURITY.md) for our vulnerability disclosure policy.

## 📞 Support

- **Technical Issues:** [GitHub Issues](https://github.com/hamsho93/vaccine/issues)
- **Questions:** [GitHub Discussions](https://github.com/hamsho93/vaccine/discussions)
- **CDC Guidelines:** [CDC Immunization Schedules](https://www.cdc.gov/vaccines/schedules/)
- **Security:** See [SECURITY.md](SECURITY.md)

## 🌟 Star History

If you find VaxRecord helpful, please star the repository to help others discover it!

## 📜 License

MIT License - free for any use, including commercial. See [LICENSE](LICENSE) for details.

---

**Built with ❤️ for healthcare professionals and public health.**

**Open source contributions welcome!** See [CONTRIBUTING.md](CONTRIBUTING.md) to get started.
