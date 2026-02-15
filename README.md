# JobTinder 💼❤️

The ultimate AI-powered job hunting platform for **StationF** startups. Find your perfect match using semantic search, automated enrichment, and personalized pitches.

## 🚀 Features

### for Candidates
- **Smart Matching**: Forget keyword search. Our AI analyzes your skills & objective to score every job (0-100%).
- **Station F Exclusive**: Real-time aggregation of 1000+ startup jobs from the Station F ecosystem.
- **Why It Matches**: Get an instant explanation of *why* a role fits you (and where you need to upskill).
- **Personalized Pitch**: AI generates a custom "Why Me" hook for every single opportunity.
- **Contact Finder (Coming Soon)**: Automatically find the hiring manager's email.

### for Productivity
- **Match Dashboard**: See your top matches at a glance, ranked by compatibility.
- **Auto-Enrichment**: Jobs are automatically analyzed in the background to add context and suggestions.
- **One-Click Apply**: Direct links to apply on the company's site.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion.
- **Backend (AI)**: Python 3.12, FastAPI, `browser-use` (AI Agent Framework).
- **Database**: Supabase (PostgreSQL + Auth).
- **AI Engine**: Google Gemini 2.0 Flash.

## 📦 Installation

### 1. Prerequisites
- Node.js 20+
- Python 3.12+
- Supabase Project (with `jobs` and `profiles` tables).
- Google Gemini API Key.

### 2. Frontend Setup
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```
OPEN: `http://localhost:3000`

### 3. Backend Setup (The Brain)
The python backend handles scraping, matching, and enrichment.

```bash
cd browser-use

# Create virtual env
python -m venv venv
# Activate:
# Windows: .\venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install requirements
pip install -r requirements.txt

# Run server
python api_server.py
```
API DOCS: `http://localhost:8000/docs`

## 🔑 Environment Variables

### Frontend (`.env.local`)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (`browser-use/.env`)
Create this file in the `browser-use` folder.

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_DIRECT_FROM_DASHBOARD  <-- CRITICAL for AI Enrichment

# AI Provider
GOOGLE_API_KEY=your_gemini_api_key
```
> **Note**: `SUPABASE_SERVICE_ROLE_KEY` is required for the backend to bypass Row Level Security (RLS) when enriching user profiles automatically.

## 🤝 Contributing
1. Fork the repo.
2. Create a feature branch.
3. Submit a PR.

## 📄 License
MIT
