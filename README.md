# CertFlow — Certificate Automation & Verification Platform

> A production-ready, full-stack enterprise web application for bulk certificate generation, automated validation, atomic sequence ID allocation, and public Certificate ID verification. Built for deployment on Vercel and GitHub.

---

## 🚀 Key Highlights & Architectural Features

- **No QR Code Dependency**: Strictly verifies authenticity using unique Certificate IDs. No QR generation, scanning, or placement.
- **Vercel-Compatible Asynchronous Chunking Engine**: Generates 100, 500, or 10,000+ certificates without hitting Vercel's serverless timeout limits (10s/60s). Work is divided into client-coordinated transactional chunks with live progress tracking (`100/500`, `200/500`, etc.).
- **Atomic, Concurrency-Safe Certificate IDs**: Configurable format (e.g. `AT-MM-SS`, `AISHWI-YYYY-MM-SS`, `CERT-00001`). Sequence blocks are reserved atomically inside database transactions with database-level uniqueness constraints.
- **Excel, CSV & Google Sheets Pipeline**:
  - Download official `.xlsx` template with pre-configured columns and an **Instructions** sheet.
  - Multi-rule validator checking for missing fields, empty candidate names, invalid dates, malformed emails, and duplicate entries.
  - Downloadable `.xlsx` error report for non-technical administrative staff.
- **Candidate-Named PDFs**: Sanitized naming format `Candidate_Name_Certificate_ID.pdf` (e.g., `Ravi_Kumar_AT-10-01.pdf`).
- **Bulk ZIP Packaging**: Streaming ZIP creation bundling all generated PDFs into `Program_Name_Certificates_YYYY-MM.zip`.
- **Public Verification Portal**: Accessible at `/verify` and `/verify/[id]` (e.g. `/verify/AT-10-01`) with real-time status (Valid / Revoked), revocation reason, and tamper logging.
- **Role-Based Access Control (RBAC)**: Enforced across `SUPER_ADMIN`, `ADMIN`, `OPERATOR`, and `VIEWER`.
- **Audit-Grade Logging**: Tracks all logins, logouts, batch creations, certificate downloads, regenerations, and revocations.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14 (App Router, Server Actions, Route Handlers) |
| **Language** | TypeScript |
| **Styling & UI** | Tailwind CSS, Lucide Icons |
| **Database & ORM**| Prisma ORM (SQLite for local zero-config testing; PostgreSQL for Supabase / Vercel Postgres) |
| **Authentication** | Secure JWT with HTTP-only cookies & Bcrypt password hashing |
| **PDF Generation** | `pdf-lib` + `@pdf-lib/fontkit` (Serverless compatible, zero Chromium headless browser overhead) |
| **Spreadsheets** | `xlsx` (SheetJS) + `papaparse` |
| **Packaging** | `jszip` |
| **Deployment Target**| Vercel Serverless Platform |

---

## 📁 Repository Structure

```
certflow/
├── prisma/
│   ├── schema.prisma             # Relational schema (16 tables)
│   └── seed.ts                   # Initial seed script (Programs, Templates, Users, Org)
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/page.tsx    # Admin login with one-click demo credentials
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Authenticated dashboard wrapper with RBAC guard
│   │   │   ├── page.tsx          # Analytics dashboard & KPI cards
│   │   │   ├── certificates/
│   │   │   │   ├── page.tsx      # Certificate registry (search, filter, revoke, regen)
│   │   │   │   └── generate/page.tsx # 7-step bulk generation wizard
│   │   │   ├── programs/page.tsx # Programs management & template assignment
│   │   │   ├── templates/page.tsx# Certificate templates directory
│   │   │   ├── candidates/page.tsx # Candidates directory & certificate history
│   │   │   ├── data-sources/page.tsx # Reusable spreadsheet sources & Google Sheets
│   │   │   ├── verification/page.tsx # Verification logs & tester simulator
│   │   │   ├── reports/page.tsx  # Analytics reports & CSV export
│   │   │   ├── users/page.tsx    # User administration & role assignment
│   │   │   ├── audit-logs/page.tsx # Immutable audit trail
│   │   │   └── settings/page.tsx # Certificate ID format & organization settings
│   │   ├── verify/
│   │   │   ├── page.tsx          # Public verification page with ID search
│   │   │   └── [id]/page.tsx     # Direct verification URL (/verify/AT-10-01)
│   │   ├── api/
│   │   │   ├── auth/             # Login, logout, me
│   │   │   ├── certificates/     # create-batch, process-chunk, finalize-batch, preview, revoke, regen
│   │   │   ├── excel/            # template download, validate, error-report
│   │   │   ├── google-sheets/    # connect & fetch
│   │   │   ├── programs/         # CRUD programs
│   │   │   ├── templates/        # CRUD templates
│   │   │   ├── candidates/       # Candidates search & history
│   │   │   ├── settings/         # ID format settings
│   │   │   ├── verify/           # Public verification lookup
│   │   │   ├── reports/          # KPI analytics
│   │   │   ├── audit-logs/       # Audit trail query
│   │   │   ├── users/            # RBAC user management
│   │   │   └── storage/          # Secure file downloads
│   │   ├── globals.css
│   │   └── layout.tsx
│   ├── components/
│   │   ├── sidebar.tsx           # Full SaaS sidebar navigation
│   │   └── header.tsx            # Header bar with user profile & verification quick-link
│   └── lib/
│       ├── db.ts                 # Prisma singleton instance
│       ├── auth.ts               # JWT, bcrypt, RBAC helpers
│       ├── id-generator.ts       # Atomic Certificate ID sequence engine
│       ├── excel-engine.ts       # Excel template generator, parser, validator
│       ├── pdf-engine.ts         # High-fidelity server-side PDF generator
│       ├── zip-engine.ts         # JSZip packaging engine
│       ├── storage.ts            # Storage abstraction (Local FS + S3/Supabase ready)
│       ├── audit.ts              # Audit logging helper
│       └── utils.ts              # Date formatting, filename sanitization
├── tests/
│   ├── run-all-tests.ts          # 26 automated unit & integration tests
│   └── simulate-500-certificates.ts # Full end-to-end 500-candidate acceptance test
├── .env.example                  # Environment variable blueprint
├── package.json
└── tsconfig.json
```

---

## ⚡ Quick Start (Local Development)

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd certflow
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` settings:
```env
DATABASE_URL="file:./dev.db"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="certflow-development-secret-key-32chars"
STORAGE_BUCKET="certificates"
```

### 3. Initialize & Seed Database
```bash
npm run db:push
npm run db:seed
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Capabilities |
|---|---|---|---|
| **Super Admin** | `admin@certflow.com` | `Admin@123456` | Full system access, users, settings, audit logs |
| **Operator** | `operator@certflow.com` | `Operator@123456` | Upload data, validate, generate certificates, download ZIP |
| **Viewer** | `viewer@certflow.com` | `Viewer@123456` | View certificates and reports (Read-only) |

---

## 🧪 Automated Testing

### Run Comprehensive Test Suite (26 Tests)
```bash
npm test
```
Tests cover:
- Bcrypt password hashing & verification
- JWT signing & session extraction
- Atomic sequence generation under monthly reset & global modes
- Multi-ID block reservation without race conditions
- Excel template download generation with Instructions worksheet
- Spreadsheet parsing & multi-rule validation
- Server-side PDF generation & filename sanitization (`Candidate_Name_Certificate_ID.pdf`)
- ZIP packaging
- Public verification lookup & revocation checks
- Anti-QR compliance assertion

### Run 500-Candidate End-to-End Acceptance Test
```bash
npx tsx tests/simulate-500-certificates.ts
```
Simulates the entire real-world workflow:
1. Generates 500 candidate records in Excel.
2. Uploads and parses the spreadsheet.
3. Validates all 500 candidates.
4. Initializes background batch job.
5. Processes chunks in batches of 100 with live progress tracking (`100/500`, `200/500`, etc.).
6. Generates 500 individual candidate-named PDFs.
7. Packages all 500 PDFs into `AI_Internship_Certificates_2026-10.zip`.
8. Verifies `AT-10-01` via public verification lookup.

---

## 🚢 Vercel Deployment Guide

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "feat: complete production-ready certflow platform"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Import into Vercel
1. Go to [Vercel Dashboard](https://vercel.com) and click **Add New > Project**.
2. Select your GitHub repository.
3. Framework Preset: **Next.js**.

### 3. Configure Production Environment Variables in Vercel
In **Settings > Environment Variables**, add:
- `DATABASE_URL`: Your production PostgreSQL connection string (Supabase, Neon, or Vercel Postgres).
  - When using PostgreSQL in production, update `provider = "postgresql"` in `prisma/schema.prisma`.
- `NEXT_PUBLIC_APP_URL`: Your production domain (e.g. `https://certificates.yourcompany.com`).
- `JWT_SECRET`: A high-entropy random string (at least 32 characters).
- `STORAGE_BUCKET`: `certificates`
- `GOOGLE_CLIENT_ID` (Optional): Google OAuth Client ID for Sheets API.
- `GOOGLE_CLIENT_SECRET` (Optional): Google OAuth Client Secret.

### 4. Deploy
Click **Deploy**. Vercel will build and serve your Next.js application at your production URL.

---

## 🔒 Security Best Practices

- Plaintext passwords are never stored; all passwords use salted Bcrypt hashes.
- Authentication tokens use secure HTTP-only cookies preventing XSS token theft.
- File uploads are validated by MIME type, extension, and content structure.
- Certificate sequences are updated using atomic database transactions.
- Public verification pages strictly mask sensitive candidate fields (e.g., email, phone).
