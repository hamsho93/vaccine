# Launch Post Templates

Templates for announcing VaxRecord's open source release.

## HackerNews (Show HN)

**Title:** Show HN: VaxRecord – Open source vaccine history parser with CDC recommendations

**Post:**

I built VaxRecord to help healthcare providers quickly parse unstructured vaccine records and generate CDC-compliant catch-up recommendations.

**What it does:**
- Paste messy vaccine history text (from medical records, printouts, etc.)
- AI parses it into structured data
- Generates CDC 2025-compliant catch-up recommendations
- Shows what vaccines are needed, when, and why

**Why I built it:**
Pediatricians spend hours manually cross-referencing vaccine histories with CDC catch-up schedules. This tool automates that process.

**Tech stack:**
- React + TypeScript + Vite frontend
- AWS Amplify Gen 2 (Lambda + API Gateway)
- OpenAI GPT-4o for parsing
- Comprehensive test suite with CDC QA validation

**Try it:**
- Live demo: [your-amplify-url]
- GitHub: https://github.com/hamsho93/vaccine
- Quick start: `npm ci && npm run dev`

**Open source:**
- MIT license
- Contributions welcome
- 21 vaccines supported
- 8 automated CDC compliance tests

Looking for feedback from healthcare professionals and devs interested in public health tech!

---

## Reddit r/healthIT

**Title:** [Open Source] VaxRecord - Vaccine History Parser with CDC Catch-Up Recommendations

**Post:**

Hey r/healthIT! I've open sourced a tool I built to help clinicians parse vaccine histories and generate CDC-compliant recommendations.

**Problem it solves:**
When patients transfer between providers or have incomplete records, manually determining catch-up schedules is time-consuming and error-prone.

**Solution:**
VaxRecord uses AI to parse unstructured vaccine text and automatically generates CDC 2025-compliant catch-up recommendations.

**Features:**
- Supports 21 vaccines (DTaP, MMR, HPV, MenACWY, COVID-19, etc.)
- Handles messy formats (various date formats, abbreviations, age notations)
- Age-specific recommendations
- Minimum interval validation
- Export to JSON/CSV

**Tech:**
- Serverless (AWS Amplify)
- Privacy-first (no data storage)
- Open source (MIT license)
- Comprehensive testing

**For healthcare orgs:**
- Self-host on your AWS account (~$15-70/month)
- HIPAA-compliant deployment guide included
- No vendor lock-in

**For developers:**
- TypeScript + React
- Well-documented architecture
- CDC QA test suite
- PRs welcome!

GitHub: https://github.com/hamsho93/vaccine

Would love feedback from HIE specialists and clinic IT folks!

---

## Reddit r/medicine

**Title:** [Tool] Open source vaccine history parser for catch-up scheduling

**Post:**

Hi r/medicine,

I've created an open source tool that might help with vaccine catch-up scheduling. Thought I'd share in case it's useful for your practice.

**What it does:**
1. Paste unstructured vaccine history (from any source)
2. AI parses it into structured doses
3. Generates CDC 2025-compliant catch-up recommendations

**Use case:**
Patients transferring from another provider, incomplete records, refugees/immigrants, or anyone needing catch-up evaluation.

**CDC compliance:**
- Based on Child & Adolescent Immunization Schedule 2025.2 (Oct 2025)
- 8 automated tests validate CDC rules
- Clear documentation of guideline alignment
- Links to specific CDC notes for each vaccine

**Privacy:**
- No patient data stored
- Session-only processing
- HIPAA-compliant when self-deployed

**Open source:**
- MIT license (free for any use)
- Deploy your own instance
- Contribute improvements

Repo: https://github.com/hamsho93/vaccine

Not trying to replace clinical judgment - just a tool to speed up the mechanical parts of catch-up scheduling.

Feedback welcome, especially from pediatricians and family medicine docs!

---

## Twitter/X Thread

**Tweet 1:**
🚀 Excited to open source VaxRecord - a vaccine history parser with CDC-compliant catch-up recommendations!

Built for clinicians who spend too much time manually cross-referencing vaccine schedules.

🔗 https://github.com/hamsho93/vaccine

🧵 Thread on why this matters ⬇️

**Tweet 2:**
Problem: Patient shows up with messy vaccine records. You need to figure out what they need.

Current process:
- Decipher handwritten notes
- Look up each vaccine in CDC schedule
- Calculate intervals
- Determine catch-up doses

⏰ Takes 15-30 minutes per patient

**Tweet 3:**
VaxRecord automates this:

1️⃣ Paste vaccine history text
2️⃣ AI structures the data
3️⃣ Get CDC recommendations instantly

Supports 21 vaccines, handles various formats, calculates intervals, flags early doses.

⚡ Results in seconds

**Tweet 4:**
Why open source?

✅ Public health impact > proprietary advantage
✅ Community can improve accuracy
✅ Free for clinics without budget
✅ Transparent CDC alignment
✅ Enable global adoption

MIT license - use it anywhere, modify as needed

**Tweet 5:**
Tech details for the devs:

- React + TypeScript + Vite
- AWS Amplify Gen 2 (serverless)
- OpenAI GPT-4o for parsing
- Comprehensive test suite
- ~$15-70/month to self-host

Great project for learning healthcare tech or contributing to public health! 💙

---

## Product Hunt

**Tagline:**
Open source vaccine history parser with CDC-compliant recommendations

**Description:**

VaxRecord helps healthcare providers quickly parse vaccine records and generate CDC catch-up schedules.

**The Problem:**
Determining catch-up vaccination schedules is time-consuming and error-prone. Providers must manually cross-reference patient histories with CDC guidelines.

**The Solution:**
VaxRecord automates vaccine history parsing and generates CDC 2025-compliant recommendations instantly.

**Key Features:**
✅ AI-powered parsing of unstructured vaccine text
✅ 21 vaccines supported (DTaP, MMR, HPV, COVID-19, etc.)
✅ CDC 2025 guidelines implementation
✅ Age-specific recommendations
✅ Export to JSON/CSV
✅ Privacy-first (no data storage)
✅ Open source (MIT license)

**For Clinics:**
- Self-host on AWS (~$15-70/month)
- HIPAA-compliant deployment
- No vendor lock-in

**For Developers:**
- TypeScript + React
- Well-documented
- Comprehensive test suite
- Contributions welcome

Built for healthcare professionals, powered by the community.

---

## LinkedIn Post

Excited to announce that VaxRecord, a vaccine history parser and CDC recommendation tool I've been building, is now open source!

**What is VaxRecord?**
A web application that helps healthcare providers:
• Parse messy vaccine records into structured data
• Generate CDC-compliant catch-up immunization schedules
• Save time on manual schedule cross-referencing

**Why open source it?**
Public health tools should be accessible to everyone. By open sourcing VaxRecord:
• Clinics without budget can deploy it for free
• The community can help improve accuracy
• We can reach more patients through broader adoption
• CDC compliance is transparent and verifiable

**Tech Stack:**
React + TypeScript, AWS Amplify (serverless), OpenAI GPT-4o, comprehensive test suite

**For Healthcare Organizations:**
Self-deploy on your AWS account for ~$20-70/month. HIPAA-compliant deployment guide included.

**For Developers:**
MIT licensed, well-documented, great for learning healthcare tech or contributing to public health.

GitHub: https://github.com/hamsho93/vaccine

If you work in healthcare IT or pediatrics, I'd love your feedback!

#HealthTech #OpenSource #PublicHealth #Immunization #HealthcareIT

---

## Email to Medical Informatics Programs

**Subject:** Open Source Vaccine History Parser - Student Project Opportunity

Dear [Program Director],

I wanted to share an open source project that might be interesting for your medical informatics students.

**Project:** VaxRecord - Vaccine History Parser with CDC Recommendations
**Repository:** https://github.com/hamsho93/vaccine
**License:** MIT (open source)

**What it is:**
A web application that parses unstructured vaccine histories and generates CDC-compliant catch-up immunization recommendations. Built with React, TypeScript, and AWS serverless architecture.

**Why it might interest your program:**
- Real-world healthcare IT problem
- Intersection of AI, public health, and clinical guidelines
- Production-ready codebase with comprehensive documentation
- Good contribution opportunities for students
- Used by actual healthcare providers

**Student contribution ideas:**
- Add new vaccine support
- Implement FHIR integration
- Build photo/PDF OCR feature
- Add multi-language support
- Improve mobile UX
- Create data visualizations

**Learning opportunities:**
- Healthcare data standards (FHIR, HL7)
- CDC guideline implementation
- HIPAA-compliant design
- AI integration in healthcare
- Serverless architecture

The codebase is well-documented with a clear CONTRIBUTING.md and architecture docs. Happy to support student contributions or course projects.

Would you be interested in sharing this with your students?

Best regards,
[Your Name]


