# Overview

This is a comprehensive medical vaccine history parsing and catch-up planning application that helps healthcare professionals analyze unstructured vaccine records and generate CDC-compliant catch-up immunization recommendations. The application uses AI (OpenAI GPT-4o) to parse free-form vaccine history text and convert it into structured data, then applies CDC catch-up immunization schedule rules to determine what vaccines a patient needs next.

The system is built as a full-stack web application with a React frontend for data input and visualization, and a Node.js/Express backend that handles both AI parsing logic and catch-up recommendation calculations. It's designed specifically for medical professionals who need to quickly process vaccine histories and generate catch-up plans based on current CDC guidelines (2025.1).

## Recent Major Improvements (Aug 1, 2025)
- **Direct birth date input**: Users now enter patient birth date directly via form field, system calculates age automatically
- **Fixed Hepatitis A logic**: Properly implements 2-dose series with 6-month intervals per CDC guidelines
- **Updated HPV intervals**: Corrected to 5-month minimum for 2-dose schedule per 2025 CDC guidelines
- **Fixed Varicella intervals**: Updated to 4-week minimum between doses for all ages
- **Enhanced Polio recommendations**: Clear dose-specific guidance with proper age requirements
- **Robust vaccine name mapping**: Centralized system recognizes 200+ vaccine name variations (HepA→Hepatitis A, flu shot→Influenza, chickenpox→Varicella)
- **Smart vaccine series recognition**: DTaP/Tdap now treated as unified vaccine series with intelligent age-based recommendations
- **CDC-compliant catch-up intervals**: Implemented exact minimum intervals from 2025 CDC catch-up schedule
- **Fixed vaccine name matching**: System properly recognizes "DTaP" in patient history matches "Tdap" recommendations
- **Age-appropriate guidance**: Eliminated routine vaccination messages for patients outside target age ranges
- **Enhanced clinical accuracy**: Detailed recommendations with specific CDC-compliant intervals and age restrictions
- **Database integration**: PostgreSQL storage with session-based tracking for anonymous usage without requiring user registration
- **Comprehensive CDC alignment review**: All 14 standard vaccines now fully aligned with CDC 2025.1 guidelines:
  - Fixed Hepatitis A logic (was falling to default case)
  - Updated HPV intervals to 5-month minimum per latest CDC guidance
  - Corrected Varicella to 4-week minimum interval for all ages
  - Enhanced Polio (IPV) with clear dose-specific recommendations
  - Verified all age restrictions, dose counts, and interval logic against CDC standards
- **Comprehensive CDC Guidelines Implementation (Aug 1, 2025)**:
  - Added vaccine-cdc-rules.ts service with complete CDC compliance logic
  - Implemented shared clinical decision-making for COVID-19 (ages 6 months-17 years)
  - Added contraindications and precautions checking system
  - Special medical conditions support (immunocompromised, asplenia, HIV, pregnancy, etc.)
  - Enhanced recommendations show decision types: routine, shared-clinical-decision, risk-based, not-recommended
  - Special situation modifications for high-risk patients
  - Frontend UI displays contraindications, precautions, and special situations with color-coded alerts
  - Interactive special conditions selection before generating catch-up recommendations

## Advanced CDC Compliance Enhancements (Aug 1, 2025)
- **Product-Specific Vaccine Logic**: Enhanced CDCVaccineRules interface to support product variants (e.g., Rotarix 2-dose vs RotaTeq 3-dose for Rotavirus)
- **Age-Dependent Intervals**: Implemented dynamic interval calculations based on patient age (e.g., Varicella: 3 months if <13 years, 4 weeks if ≥13 years)
- **Seasonal Vaccine Tracking**: Added isAnnual flag for seasonal vaccines with proper flu season detection (July 1 - June 30)
- **Enhanced Service Architecture**: 
  - vaccine-catchup.ts serves as the recommendation engine (the "chef")
  - vaccine-cdc-rules.ts acts as the CDC guidelines database (the "recipe book")
  - Improved separation of concerns between rule definitions and recommendation logic
- **Product Variants Implemented**:
  - Rotavirus: Rotarix (2 doses), RotaTeq (3 doses), Unknown (3 doses default)
  - COVID-19: Pfizer (3 doses for 6m-4y), Moderna (2 doses for 6m-4y)
  - Support for future product-specific variations
- **Smart Interval Calculations**: Functions that return age-appropriate intervals dynamically based on patient's current age
- **Comprehensive Testing**: Verified age-dependent intervals and product-specific logic work correctly in live implementation

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom medical theme colors
- **State Management**: React Hook Form for form handling, TanStack Query for server state
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite with custom alias configuration

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful API with structured error handling
- **Service Layer**: Modular service architecture with:
  - VaccineParserService: AI-powered text parsing using OpenAI GPT-4o
  - VaccineCatchUpService: CDC catch-up immunization schedule calculations
  - VaccineCDCRulesService: Comprehensive CDC guidelines implementation with contraindications and special situations
  - VaccineNameMapper: Centralized vaccine name normalization and age-specific display logic

## Data Management
- **Database**: PostgreSQL with Drizzle ORM for persistent storage
- **Tables**: Users, vaccine history records, and catch-up recommendations
- **Session Management**: Session-based tracking for anonymous usage without requiring user registration
- **Schema Validation**: Zod for runtime type checking and API validation
- **Data Structure**: Shared TypeScript types between frontend and backend via shared schema

## AI Integration
- **Provider**: OpenAI GPT-4o for natural language processing
- **Purpose**: Parsing unstructured vaccine history text into standardized CDC-compliant format
- **Birth Date Handling**: Uses user-provided birth date to calculate accurate patient age
- **Output Format**: Structured JSON with patient info, vaccine records, doses, and completion status

## Catch-Up Recommendation Engine
- **CDC Guidelines**: Based on 2025.1 CDC catch-up immunization schedule with comprehensive guidelines
- **Coverage**: All standard vaccines (HepB, Rotavirus, DTaP, Hib, PCV, IPV, COVID-19, Influenza, MMR, VAR, HepA, Tdap, HPV, MenACWY, MenB)
- **Logic**: Calculates minimum intervals, age requirements, maximum age limits, and special conditions
- **Advanced Features**:
  - Shared clinical decision-making protocols (e.g., COVID-19 for ages 6 months-17 years)
  - Contraindications and precautions checking
  - Special medical conditions support (immunocompromised, asplenia, HIV, pregnancy, etc.)
  - Risk-based recommendations for high-risk populations
  - 4-day grace period rule implementation
  - Enhanced guidance for special situations
- **Output**: Comprehensive recommendations with:
  - Next dose dates and clinical notes
  - Decision type indicators (routine, shared-clinical-decision, risk-based)
  - Contraindications and precautions when applicable
  - Special situation modifications

## Authentication & Session Management
- **Storage**: PostgreSQL-based storage with session-based tracking
- **User Management**: Optional user model with anonymous session support
- **Session Tracking**: Each browser session gets a unique ID for tracking processing history

## Development Environment
- **Hot Reload**: Vite dev server with HMR for frontend development
- **Error Handling**: Runtime error overlay and structured API error responses
- **Logging**: Custom request/response logging middleware for API endpoints

## Key Design Patterns
- **Separation of Concerns**: Clear separation between frontend UI, backend services, and shared types
- **Type Safety**: End-to-end TypeScript with shared schema validation
- **Component Architecture**: Modular UI components with consistent styling via design system
- **Error Boundaries**: Comprehensive error handling at both API and UI levels

# External Dependencies

## Core AI Service
- **OpenAI API**: GPT-4o model for parsing vaccine history text into structured data
- **Environment**: Requires OPENAI_API_KEY environment variable

## Database Services  
- **PostgreSQL**: Primary database (via DATABASE_URL environment variable)
- **Neon Database**: Serverless PostgreSQL driver for cloud deployment
- **Drizzle**: Type-safe ORM with migration support

## UI & Styling
- **Radix UI**: Comprehensive set of accessible UI primitives
- **Tailwind CSS**: Utility-first CSS framework with custom medical theme
- **Lucide Icons**: Icon library for consistent iconography

## Development & Build Tools
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type checking and compilation
- **ESBuild**: Backend bundling for production builds

## Form & Data Handling
- **React Hook Form**: Form state management and validation
- **TanStack Query**: Server state management and caching
- **Zod**: Runtime schema validation and type inference

## Session & Storage
- **connect-pg-simple**: PostgreSQL session store for Express sessions
- **crypto**: Node.js built-in for generating user IDs

## Deployment Platform
- **Replit**: Development and hosting platform with specialized Vite plugins for the Replit environment