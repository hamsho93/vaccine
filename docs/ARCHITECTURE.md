# Architecture Documentation

## System Overview

VaxRecord is a serverless application built on AWS Amplify Gen 2, consisting of a React frontend and Lambda-based backend API.

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     User's Browser                       │
│  ┌────────────────────────────────────────────────────┐  │
│  │         React Frontend (Vite + TypeScript)          │  │
│  │  - Vaccine history input (text or structured)       │  │
│  │  - Results display with recommendations             │  │
│  │  - CDC reference links                              │  │
│  └─────────────────────┬──────────────────────────────┘  │
└────────────────────────┼─────────────────────────────────┘
                         │ HTTPS
                         ▼
         ┌───────────────────────────────────┐
         │   API Gateway (HTTP API v2)       │
         │   - CORS handling                 │
         │   - Request routing               │
         └──────────────┬────────────────────┘
                        │
                        ▼
         ┌───────────────────────────────────┐
         │   Lambda Handler (Node.js 20)     │
         │   /api/parse-vaccine-history      │
         │   /api/vaccine-catchup            │
         │   /api/health                     │
         └──────────┬──────────────┬─────────┘
                    │              │
                    ▼              ▼
         ┌──────────────┐   ┌─────────────────┐
         │  OpenAI API  │   │  Vaccine Logic  │
         │  (GPT-4o)    │   │  (CDC Rules)    │
         └──────────────┘   └─────────────────┘
```

## Frontend Architecture

### Technology Stack

- **Framework:** React 18
- **Build Tool:** Vite 5
- **Language:** TypeScript
- **UI Library:** shadcn/ui + Radix UI
- **Styling:** Tailwind CSS
- **State Management:** React hooks + TanStack Query
- **Forms:** React Hook Form + Zod validation

### Directory Structure

```
client/
├── src/
│   ├── components/
│   │   └── ui/              # shadcn/ui components
│   ├── pages/
│   │   └── vaccine-parser.tsx  # Main application page
│   ├── lib/
│   │   ├── amplify-client.ts   # API service layer
│   │   ├── queryClient.ts      # TanStack Query config
│   │   └── utils.ts            # Utility functions
│   ├── hooks/
│   │   ├── use-toast.ts        # Toast notifications
│   │   └── use-mobile.tsx      # Responsive detection
│   ├── App.tsx               # Root component
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles
└── index.html
```

### Data Flow

1. **Input**: User pastes vaccine history text or uses structured entry
2. **Parse**: POST to `/api/parse-vaccine-history` with OpenAI GPT-4o
3. **Display**: Show structured vaccine table
4. **Recommendations**: POST to `/api/vaccine-catchup` with parsed data
5. **Results**: Display categorized recommendations with CDC links

### State Management

- Form state: React Hook Form
- API calls: TanStack Query (caching, retry logic)
- Local state: useState for UI toggles
- No global state management needed (single-page app)

## Backend Architecture

### Technology Stack

- **Runtime:** Node.js 20 (AWS Lambda)
- **Framework:** None (direct Lambda handler)
- **Language:** TypeScript
- **Validation:** Zod schemas
- **AI:** OpenAI GPT-4o for text parsing

### Directory Structure

```
packages/my-shared-backend/
├── amplify/
│   ├── api/
│   │   ├── handler.ts         # Main Lambda handler
│   │   └── resource.ts        # API Gateway config
│   ├── auth/                  # (Not currently used)
│   ├── data/                  # (Not currently used)
│   └── backend.ts             # Amplify Gen 2 config
├── server/
│   └── services/
│       ├── vaccine-parser.ts        # OpenAI integration
│       ├── vaccine-catchup.ts       # Main catch-up logic
│       ├── vaccine-cdc-rules.ts     # CDC rule definitions
│       ├── vaccine-name-mapper.ts   # Vaccine name normalization
│       └── vaccines/
│           ├── dtap_tdap.ts         # DTaP/Tdap logic
│           ├── meningococcal_acwy.ts
│           ├── pneumococcal.ts
│           ├── covid19.ts
│           └── ... (21 vaccine modules)
└── shared/
    └── schema.ts              # Zod schemas (shared with frontend)
```

### Request Flow

1. **API Gateway** receives POST request
2. **Lambda Handler** (`amplify/api/handler.ts`):
   - Validates CORS
   - Routes to appropriate endpoint
   - Parses request body
3. **Service Layer**:
   - `VaccineParserService`: Sends text to OpenAI, structures response
   - `VaccineCatchUpService`: Generates CDC-compliant recommendations
4. **Vaccine Modules**: Individual vaccine logic files return recommendations
5. **Response**: JSON with recommendations, notes, next dose dates

### Vaccine Recommendation Logic

Each vaccine has its own module implementing:

```typescript
export function vaccineRecommendation(
  normalizedName: string,
  birthDate: Date,
  currentDate: Date,
  validDoses: VaccineDoseInfo[],
  numDoses: number,
  sortedDoses: VaccineDoseInfo[],
  specialConditions: SpecialConditions,
  immunityEvidence: any
): VaccineRecommendation | null {
  // 1. Age checks (min/max)
  // 2. Dose count validation
  // 3. Interval calculations
  // 4. Catch-up vs routine determination
  // 5. Special conditions handling
  // 6. Return structured recommendation
}
```

### CDC Rules Engine

`vaccine-cdc-rules.ts` contains:

```typescript
export const cdcVaccineRules: Record<string, CDCVaccineRules> = {
  'dtap': {
    minimumAge: 42,  // days
    dosesRequired: 5,
    minimumIntervals: [28, 28, 168, 168],  // days
    maximumAge: 2555,  // 7 years
    contraindications: [...],
    specialSituations: [...]
  },
  // ... other vaccines
};
```

## Data Models

### Shared Schemas (Zod)

```typescript
// Request to parse vaccine history
ParseVaccineHistoryRequest {
  vaccineData: string;
  birthDate: string;  // YYYY-MM-DD
}

// Parsed result
VaccineHistoryResult {
  patientInfo: PatientInfo;
  vaccines: VaccineRecord[];
  processingNotes: string[];
  cdcVersion: string;
  processedAt: string;
}

// Request for catch-up recommendations
CatchUpRequest {
  birthDate: string;
  currentDate: string;
  vaccineHistory: VaccineHistory[];
  specialConditions?: SpecialConditions;
}

// Catch-up result
CatchUpResult {
  patientAge: string;
  recommendations: VaccineRecommendation[];
  cdcVersion: string;
  processedAt: string;
}
```

## Scaling Considerations

### Current Limits

- Lambda: 15-second timeout (adequate for parsing)
- API Gateway: 30-second timeout
- Concurrent Lambda executions: 1,000 (AWS default)
- OpenAI rate limits: Per API key tier

### Optimization Strategies

**If response times increase:**
- Cache OpenAI results for identical inputs (TTL: 1 hour)
- Use Lambda provisioned concurrency for cold start mitigation
- Implement request deduplication

**If usage grows:**
- Implement API Gateway caching (5-minute TTL)
- Add CloudFront CDN in front of frontend
- Rate limiting per IP/session

## Security Architecture

### Authentication

Currently: None (public tool)

Future options:
- Cognito for user accounts
- API keys for clinic integrations
- OAuth for EHR connections

### Data Protection

- **No persistence**: All data in-memory only
- **HTTPS only**: TLS 1.2+ enforced
- **CORS**: Restricted to authorized domains
- **Input validation**: Zod schemas on all requests
- **No logging of PHI**: Logs contain only non-identifying metadata

### Lambda Permissions

- Read-only access to OpenAI API
- No database access
- No S3 or other AWS service access
- Minimal IAM role (execution role only)

## Monitoring & Observability

### CloudWatch Logs

Lambda automatically logs:
- Request/response payloads (sanitized)
- Errors and stack traces
- Execution duration

### Metrics to Track

- Parse success rate
- Recommendation generation success rate
- Average response time
- OpenAI API errors
- 4xx/5xx error rates

### Alarms to Set

- Lambda error rate > 1%
- API Gateway 5xx > 1%
- Lambda duration > 10 seconds
- OpenAI API failures > 5%

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
on: [pull_request, push to main]

jobs:
  - Type check (root + backend)
  - ESLint
  - Build frontend
  - Unit tests with coverage (60% threshold)
```

### Amplify Auto-Deploy

- Triggered on push to `main`
- Builds both frontend and backend apps
- ~5 minutes total build time

## Performance

### Current Metrics

- Cold start: ~2-3 seconds
- Warm Lambda: ~500ms-2s (OpenAI dependent)
- Frontend load: ~1-2 seconds
- Frontend bundle: ~450KB gzipped

### Optimization Opportunities

- Tree-shake unused Radix UI components
- Lazy load recommendation tabs
- Code split by route (if multi-page added)
- Optimize Lucide icon imports

## Development Workflow

```bash
# Local development
npm run dev        # Starts server on :8080, frontend on :5173

# Testing
npm test           # Unit tests with coverage
npm run qa         # CDC QA scenarios (requires dev server)
npm run smoke      # API smoke test

# Code quality
npm run check      # TypeScript
npm run lint       # ESLint

# Build
npm run build:frontend  # Vite production build
```

## Technology Decisions

### Why Amplify Gen 2?

- Serverless (scales to zero)
- Simple deployment (no server management)
- Type-safe infrastructure as code
- Good for MVP and open source projects

### Why OpenAI GPT-4o?

- Handles unstructured text parsing well
- Recognizes vaccine name variations
- Can extract dates in multiple formats
- Cost-effective for moderate usage

### Why Vite over Create React App?

- Faster builds
- Modern ESM-based
- Better developer experience
- Smaller production bundles

### Why Zod for Validation?

- Type-safe runtime validation
- Schema sharing between frontend/backend
- Excellent error messages
- TypeScript inference

## Future Architecture Considerations

### For Scale (1000+ users/day)

- Add Redis caching layer
- Implement request deduplication
- Use SQS for async processing
- Add CloudFront CDN

### For Multi-Tenancy (Clinics)

- Add Cognito authentication
- Implement organization/team structure
- Add RDS PostgreSQL for session history
- Enable batch processing

### For EHR Integration

- FHIR API endpoints
- SMART-on-FHIR OAuth flow
- HL7 message processing
- Epic/Cerner marketplace apps

---

This architecture is designed for:
- Easy contribution (monorepo, clear separation of concerns)
- Low operational overhead (serverless)
- CDC guideline maintainability (modular vaccine services)
- Open source collaboration (well-documented, testable)

