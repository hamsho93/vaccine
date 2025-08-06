# VaxRecord - AI-Powered Vaccine History Parser & CDC Catch-Up Recommendations

A comprehensive, CDC-compliant vaccine history parsing and immunization recommendation system for healthcare professionals. Converts unstructured vaccine records into structured data with AI-powered parsing and provides real-time CDC catch-up immunization recommendations.

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

## 🚀 AWS Amplify Deployment

### Prerequisites

1. **AWS Account** with Amplify access
2. **GitHub Repository** containing this code
3. **Environment Variables** for production
4. **Database** (Neon PostgreSQL recommended)
5. **OpenAI API Key** for vaccine parsing

### Required Environment Variables

Configure these in **AWS Amplify Console → App Settings → Environment Variables**:

```bash
# Application Environment
NODE_ENV=production
PORT=3000

# Database Configuration (Neon PostgreSQL)
DATABASE_URL=postgresql://username:password@host:5432/database?sslmode=require

# AI Integration (OpenAI)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional Features
ENABLE_ANALYTICS=false
```

### Step-by-Step Deployment

#### 1. **Prepare Repository**
```bash
# Clone and prepare repository
git clone your-repository-url
cd VaxRecord

# Verify deployment readiness
npm install
npm run build  # Should complete without errors
npm test       # Run tests to ensure functionality
```

#### 2. **Set Up Database**
1. Create a [Neon PostgreSQL](https://neon.tech) database
2. Copy the connection string
3. Test connection: `npm run db:push`

#### 3. **AWS Amplify Setup**
1. **Connect Repository:**
   - Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify/)
   - Choose "Host web app"
   - Connect your GitHub repository
   - Select the `main` branch

2. **Build Settings:**
   - Amplify will auto-detect `amplify.yml`
   - Build command: `npm run build`
   - Artifacts: `dist/**/*`
   - No manual configuration needed

3. **Environment Variables:**
   - Navigate to App Settings → Environment Variables
   - Add all required variables listed above
   - **Critical:** Ensure `DATABASE_URL` is your production database

4. **Deploy:**
   - Click "Save and Deploy"
   - Monitor build logs (~5-10 minutes)
   - Access your deployed app via the Amplify URL

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │───▶│  Express API    │───▶│  Neon Database  │
│  (Vite + TS)    │    │  (Node.js)      │    │  (PostgreSQL)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       
         ▼                       ▼                       
┌─────────────────┐    ┌─────────────────┐               
│  shadcn/ui      │    │   OpenAI API    │               
│  Tailwind CSS   │    │   (GPT-4o)      │               
└─────────────────┘    └─────────────────┘               
```

**Tech Stack:**
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend:** Node.js + Express + TypeScript
- **Database:** Neon PostgreSQL (serverless)
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
├── server/                 # Express backend
│   ├── services/           # Business logic
│   │   └── vaccines/       # Individual vaccine modules
│   ├── routes.ts           # API endpoints
│   └── index.ts            # Server entry point
├── shared/                 # Shared types/schemas
│   └── schema.ts           # Zod validation schemas
├── tests/                  # Test files
├── amplify.yml             # AWS Amplify build config
└── package.json            # Dependencies & scripts
```

## 📋 API Reference

### Core Endpoints

#### Parse Vaccine History
```http
POST /api/vaccine-history/parse
Content-Type: application/json

{
  "vaccineHistory": "string",
  "birthDate": "YYYY-MM-DD",
  "specialConditions": {
    "immunocompromised": boolean,
    "asplenia": boolean
  }
}
```

**Response:**
```json
{
  "parsedVaccines": [
    {
      "vaccine": "string",
      "date": "YYYY-MM-DD",
      "product": "string",
      "dose": number
    }
  ],
  "recommendations": [
    {
      "vaccineName": "string",
      "recommendation": "string",
      "nextDoseDate": "YYYY-MM-DD",
      "seriesComplete": boolean,
      "notes": ["string"],
      "decisionType": "routine|catch-up|shared-clinical-decision|risk-based|not-recommended|international-advisory|aged-out"
    }
  ]
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

## 📞 Support

### For Technical Issues:
- Check AWS Amplify build logs
- Verify all environment variables are configured
- Test database and API connectivity
- Review application logs for specific errors

### For Clinical Questions:
- Refer to [CDC Child Immunization Schedule](https://www.cdc.gov/vaccines/hcp/imz-schedules/child-adolescent-notes.html)
- Consult with clinical subject matter experts
- Review ACIP recommendations for latest updates

---

**⚕️ Built for healthcare professionals following CDC immunization guidelines.**
**🛡️ HIPAA-compliant design with privacy-first architecture.**
**🌍 Supporting public health through accurate vaccine recommendations.**
