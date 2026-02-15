# Scrape Station F Jobs

## Goal
Scrape job listings from Station F's job board (jobs.stationf.co) and store them in Supabase.

## Overview

Station F is Europe's largest startup campus. Their job board has 600+ startup jobs that we scrape and display in our Tinder-style interface.

**Source URL**: https://jobs.stationf.co

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  Frontend   │────▶│  Next.js API     │────▶│  Python FastAPI │
│  /stationf  │     │  /api/stationf   │     │  :8000/scrape/  │
└─────────────┘     └──────────────────┘     └────────┬────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │  jobs.stationf  │
                                             │      .co        │
                                             └────────┬────────┘
                                                      │
                                                      ▼
                                             ┌─────────────────┐
                                             │    Supabase     │
                                             │   jobs table    │
                                             └─────────────────┘
```

## Inputs

- **None required** - The scraper fetches all available jobs from Station F

## Execution

### 1. Start the Python API Server
```bash
cd browser-use
python -m venv venv
.\venv\Scripts\activate  # Windows
pip install -r requirements.txt
python api_server.py     # Runs on http://127.0.0.1:8000
```

### 2. Trigger the Scrape
The scrape is triggered via:
- **Frontend**: Visit `/stationf` page
- **API call**: `GET http://127.0.0.1:8000/scrape/stationf`

### 3. What the Scraper Does
1. Navigate to jobs.stationf.co
2. Paginate through all job listings
3. Extract: company name, job title, location, job URL, description
4. Return JSON array of jobs
5. Frontend stores results in Supabase `jobs` table with `source: 'stationf'`

## Outputs

Jobs are stored in Supabase `jobs` table with schema:
```json
{
  "id": "uuid",
  "title": "Software Engineer",
  "company": "Startup XYZ",
  "location": "Paris, France",
  "url": "/jobs/12345",
  "description": "...",
  "source": "stationf",
  "created_at": "timestamp"
}
```

## Execution Script

**Script**: `execution/scrape_stationf.py` (TODO: create)

Uses `browser-use` framework with Playwright for browser automation.

## Edge Cases & Learnings

### Known Issues
- [ ] Station F may rate-limit aggressive scraping
- [ ] Job URLs are relative (prefix with `https://jobs.stationf.co`)
- [ ] Site structure may change - selectors need maintenance

### Rate Limiting
- Add 1-2 second delays between page loads
- Consider caching results for 24 hours

### Verification
Run `node count_stationf.js` to count Station F jobs in the database.

## Related Files

- `src/app/api/stationf/route.js` - Next.js API route
- `src/app/stationf/page.js` - Station F frontend page
- `count_stationf.js` - Utility to count jobs in DB
- `browser-use/api_server.py` - Python FastAPI server (TODO: rebuild)

## TODO

- [ ] Rebuild `browser-use/api_server.py` with scraping endpoint
- [ ] Create `execution/scrape_stationf.py` script
- [ ] Add incremental scraping (only new jobs)
- [ ] Add error handling for site changes
