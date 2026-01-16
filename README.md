# JobTinder 💼❤️

A Tinder-style job swiping application built with Next.js and Supabase. Optimized for finding jobs through traditional sources and specialized hubs like **Station F**.

## Features

- 🔐 **Authentication** - Signup, Login, Logout with Supabase Auth
- 💼 **Job Swiping** - Tinder-style one-at-a-time job cards for general listings
- 🚀 **Station F Experience** - Dedicated portal for over 600+ startup jobs from Station F
- 🤖 **AI-Powered Tools**:
  - **Match Scoring** - Personalized matching based on your profile
  - **CV & Cover Letter Generation** - ATS-optimized documents generated on the fly
  - **LinkedIn Contact Finder** - Automatically find the CEO or HR contact for any company
  - **Personalized Pitches** - Custom "Why you?" insights for every company
- ❤️ **Like to Apply** - Like a job to create a draft application
- � **Unified Profile** - Store your skills and objective to power matching engines

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & Framer Motion (for animations)
- **Database/Auth**: Supabase (PostgreSQL)

### Backend (AI & Automation)
- **Language**: Python 3.12+
- **Agent Framework**: `browser-use` (Playwright-based AI agents)
- **LLM**: Google Gemini 2.0 Flash
- **API**: FastAPI (Fast & Modern Python web framework)

## Project Structure

```
├── src/                # Next.js Frontend
│   ├── app/            # Pages (jobs, liked, profile, stationf)
│   ├── components/     # UI Components (JobCard, GenerationModal, etc.)
│   ├── lib/            # Shared utilities
├── browser-use/        # Python AI Backend
│   ├── api_server.py   # FastAPI server
│   ├── Dockerfile      # Deployment config for Render
│   └── .env.example    # Environment setup
├── supabase/           # Migrations & Database schema
└── README.md
```

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- Supabase project
- Google Gemini API Key

### Installation

1. **Frontend**:
   ```bash
   npm install
   npm run dev
   ```

2. **Backend**:
   ```bash
   cd browser-use
   python -m venv venv
   source venv/bin/activate # Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   python api_server.py
   ```

### Environment Variables

Create `.env.local` in the root and `browser-use/.env` for the backend.

**Root `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key (optional for scraping)
```

**`browser-use/.env`**:
```env
GOOGLE_API_KEY=your_gemini_api_key
```

## License
MIT
