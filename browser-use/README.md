# Browser Use Backend

Python backend for JobTinder using browser-use for AI-powered browser automation.

## Setup

1. Create virtual environment:
```bash
cd browser-use
python -m venv venv
.\venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
uvx browser-use install  # Install Chromium browser
```

3. Create `.env` file:
```bash
GOOGLE_API_KEY=your_gemini_api_key
```

4. Run the server:
```bash
python api_server.py
```

Server runs on http://127.0.0.1:8000

## Endpoints

- `GET /` - Health check
- `GET /scrape/stationf` - Scrape Station F job listings
- `POST /generate` - Generate CV/Cover Letter
- `POST /contact` - Find LinkedIn contacts
- `POST /personalize` - Generate personalized insights
