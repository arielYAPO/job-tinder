# Scope 🎯

AI-powered job matching platform built for the **Station F** startup ecosystem. Matches your profile against 1000+ startup job postings using a custom scoring algorithm, then enriches your top matches with AI-generated outreach strategies.

**Live at**: [scope-ai.vercel.app](https://job-tinder-napx.vercel.app)

---

## ✨ Features

### 🔍 Smart Job Matching
- Custom **scoring algorithm** (0–100%) that compares your skills, target role, and contract type against every job in the database.
- Results grouped by company, ranked by compatibility score, with matched skills highlighted.
- Freemium model with daily usage limits (3 AI enrichments/day, 5 contact lookups/day), tracked per user and auto-resetting.

### 🤖 Background AI Enrichment
- After matching, a **background process** sends your top 25 companies to **Google Gemini** for deep analysis.
- Gemini classifies each job (tech vs non-tech, role labels, AI relevance) and generates **3 personalized outreach role suggestions** per company — tailored to junior/alternance profiles.
- Results appear silently in the UI once ready, without blocking the user.

### 📋 Job Description Simplifier
- Converts dense job descriptions into a structured **TL;DR** (summary, missions, tech stack, requirements, soft skills, perks) via Gemini.
- Results are cached in a `simplified_jobs` table to avoid redundant API calls.

### 👤 Contact Finder
- Finds the **CTO or hiring manager** for any matched company using Serper (Google Search API) to locate LinkedIn profiles.
- Generates **3 probable email formats** (firstname@domain, firstname.lastname@domain, etc.) based on the domain found in the database.
- Results are cached in a `generated_contacts` table.

### 📡 Data Pipeline
- **Algolia Scraper**: Queries the Welcome to the Jungle / Station F Algolia index to fetch all startup job postings. Handles pagination, deduplication, and upserts to Supabase.
- **La Bonne Alternance**: Integrated with the French government's apprenticeship API to surface additional alternance opportunities by location and ROME codes.

---

## 🛠 Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15 (App Router), React, Tailwind CSS, Framer Motion, shadcn/ui, Lucide Icons |
| **Backend API** | Python 3.12, FastAPI, Pydantic, Uvicorn |
| **AI** | Google Gemini (2.0 Flash) — enrichment, CV generation, job simplification |
| **Database & Auth** | Supabase (PostgreSQL, Row-Level Security, Supabase Auth with SSR) |
| **External APIs** | Algolia (job scraping), Serper (contact search), La Bonne Alternance (apprenticeship jobs) |
| **Deployment** | Vercel (frontend), VPS (Python API) |

---

## 🏗 Architecture

```
┌─────────────────┐     Proxy Routes      ┌──────────────────┐
│   Next.js App   │ ──────────────────────▶│  FastAPI (Python) │
│   (Vercel)      │  /api/match-proxy      │  (VPS)           │
│                 │  /api/enrich-proxy     │                  │
│  - Auth check   │  /api/contact          │  - Match algo    │
│  - Rate limit   │                        │  - Enrichment    │
│  - Supabase SSR │                        │  - Scraping      │
└────────┬────────┘                        └────────┬─────────┘
         │                                          │
         └──────────────┐  ┌────────────────────────┘
                        ▼  ▼
                  ┌──────────────┐
                  │   Supabase   │
                  │  PostgreSQL  │
                  │  + Auth      │
                  │  + RLS       │
                  └──────────────┘
```

**Key design decisions:**
1. **Proxy pattern**: The frontend never calls the Python API directly. All requests go through Next.js API routes (`/api/match-proxy`, `/api/enrich-proxy`, `/api/contact`) which enforce authentication and rate limiting server-side.
2. **Non-blocking enrichment**: Matching returns instantly (CPU-only scoring). AI enrichment runs in the background and silently refreshes the UI when done.
3. **Freemium rate limiting**: Usage counters stored in the `profiles` table with daily auto-reset — no Redis needed.

---

## 📦 Setup

### Prerequisites
- Node.js 20+
- Python 3.12+
- Supabase project (with Auth and database configured)
- Google Gemini API key

### Frontend
```bash
npm install
npm run dev
```
→ `http://localhost:3000`

### Python Backend
```bash
cd browser-use

# Create virtual environment
python -m venv venv
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

pip install -r requirements.txt
python api_server.py
```
→ API docs at `http://localhost:8000/docs`

---

## 🔑 Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
GEMINI_API_KEY=your_gemini_api_key
SERPER_API_KEY=your_serper_api_key
LBA_API_TOKEN=your_labonnealternance_token
```

### Backend (`browser-use/.env`)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GOOGLE_API_KEY=your_gemini_api_key
```

> **Note**: `SUPABASE_SERVICE_ROLE_KEY` is required for the backend to bypass RLS when performing background updates (AI enrichments, job catalog updates).

---

## 📄 License
MIT
