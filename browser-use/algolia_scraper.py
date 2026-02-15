"""
Algolia API Scraper for Station F / Welcome to the Jungle Jobs
==============================================================

This module uses the hidden Algolia API instead of HTML scraping.
Much faster, more reliable, and provides richer data (logo, slug, etc.)

Usage:
    python algolia_scraper.py

API Details:
    - Endpoint: https://csekhvms53-dsn.algolia.net/1/indexes/*/queries
    - Index: wk_cms_jobs_production_careers
    - Filter: Station F jobs only (embedded in API key)
"""

import os
import sys
import json
import requests
from datetime import datetime
from typing import List, Dict, Optional
from dotenv import load_dotenv

# Load environment variables
root_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(root_dir, "..", ".env.local"))
load_dotenv(os.path.join(root_dir, ".env"))

# Supabase setup (optional - for DB saving)
try:
    from supabase import create_client
    supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

    if supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
    else:
        print("[!] Supabase credentials not found. Jobs won't be saved to DB.")
        supabase = None
except ImportError:
    print("[!] supabase module not installed. Running in preview-only mode.")
    supabase = None


# ============================================================
# ALGOLIA CONFIGURATION
# ============================================================

ALGOLIA_APP_ID = "CSEKHVMS53"
ALGOLIA_API_KEY = "ZTQzYjA0MGViZWQ5YmU0YWRkMjQ0ODhlYmFiOGNiOTU1MmVmMmExZDFkMDI2MjNmMGExNTA1OTdlMjM4ZDlhN2ZpbHRlcnM9d2Vic2l0ZS5yZWZlcmVuY2UlM0FzdGF0aW9uLWYtam9iLWJvYXJk"
ALGOLIA_INDEX = "wk_cms_jobs_production_careers"
ALGOLIA_ENDPOINT = f"https://{ALGOLIA_APP_ID.lower()}-dsn.algolia.net/1/indexes/*/queries"

# Headers for Algolia API
ALGOLIA_HEADERS = {
    "X-Algolia-Application-Id": ALGOLIA_APP_ID,
    "X-Algolia-API-Key": ALGOLIA_API_KEY,
    "Content-Type": "application/json"
}

# Tech departments filter (set to empty string to get ALL jobs)
# TECH_FILTER = '["department:Tech","department:Engineering","department:Data","department:Product"]'
TECH_FILTER = ''  # Empty = ALL departments (716+ jobs)


# ============================================================
# MAIN SCRAPING FUNCTION
# ============================================================

def fetch_algolia_jobs(page: int = 0, hits_per_page: int = 50) -> Dict:
    """
    Fetch a single page of jobs from Algolia API.
    
    Args:
        page: Page number (0-indexed)
        hits_per_page: Number of results per page (max 1000)
    
    Returns:
        Algolia response dict with 'hits', 'nbHits', 'nbPages', etc.
    """
    payload = {
        "requests": [
            {
                "indexName": ALGOLIA_INDEX,
                "params": f"hitsPerPage={hits_per_page}&page={page}" + (f"&facetFilters=[{TECH_FILTER}]" if TECH_FILTER else "")
            }
        ]
    }
    
    try:
        response = requests.post(
            ALGOLIA_ENDPOINT,
            headers=ALGOLIA_HEADERS,
            json=payload,
            timeout=30
        )
        response.raise_for_status()
        data = response.json()
        
        # Algolia returns results in results[0] for single query
        return data.get("results", [{}])[0]
        
    except requests.exceptions.RequestException as e:
        print(f"[X] Algolia API Error: {e}")
        return {"hits": [], "nbHits": 0, "nbPages": 0}


def map_algolia_hit_to_job(hit: Dict) -> Dict:
    """
    Map an Algolia hit to our Supabase job schema.
    
    Algolia Hit Structure:
        - objectID: unique identifier
        - name: job title
        - organization: {name, slug, logo: {url}}
        - contract_type: {fr, en}
        - office: {city, country}
        - published_at: ISO date
        - slug: job slug for URL
        - description: job description (HTML)
        - profile: required profile/skills (HTML)
        - department: {name}
    """
    org = hit.get("organization") or {}
    office = hit.get("office") or {}
    contract = hit.get("contract_type") or {}
    logo = org.get("logo") or {}
    
    # Build the apply URL
    org_slug = org.get("slug", "")
    job_slug = hit.get("slug", "")
    apply_url = f"https://www.welcometothejungle.com/fr/companies/{org_slug}/jobs/{job_slug}" if org_slug and job_slug else ""
    
    # Concatenate description + profile for full context (for Gemini analysis)
    description = hit.get("description") or ""
    profile = hit.get("profile") or ""
    full_description = f"{description}\n\n--- PROFIL RECHERCHE ---\n\n{profile}".strip()
    
    # Handle contract_type (can be string or dict)
    if isinstance(contract, dict):
        contract_type_str = contract.get("fr", contract.get("en", ""))
    else:
        contract_type_str = str(contract) if contract else ""
    
    # Build location string
    city = office.get("city", "") if isinstance(office, dict) else ""
    country = office.get("country", {}) if isinstance(office, dict) else {}
    country_name = country.get("fr", "") if isinstance(country, dict) else str(country)
    location = f"{city}, {country_name}".strip(", ") if city else "Remote"
    
    return {
        "external_id": hit.get("objectID"),
        "title": hit.get("name", "Untitled"),
        "company_name": org.get("name", "Unknown"),
        "company_slug": org_slug,
        "logo_url": logo.get("url") if isinstance(logo, dict) else None,
        "contract_type": contract_type_str,
        "location": location,
        "published_at": hit.get("published_at"),
        "apply_url": apply_url,
        "job_description": full_description,
        "department": hit.get("department", {}).get("name", "") if isinstance(hit.get("department"), dict) else "",
        "source": "algolia_stationf",
        "scraped_at": datetime.utcnow().isoformat(),
    }


def scrape_all_jobs(max_pages: int = 100, save_to_db: bool = True) -> List[Dict]:
    """
    Scrape all tech jobs from Algolia API.
    
    Args:
        max_pages: Maximum pages to scrape (safety limit)
        save_to_db: Whether to upsert to Supabase
    
    Returns:
        List of all scraped jobs
    """
    all_jobs = []
    page = 0
    
    print("[>] Starting Algolia API Scrape...")
    print(f"   Endpoint: {ALGOLIA_ENDPOINT}")
    print(f"   Filter: Tech/Engineering/Data/Product")
    print("-" * 50)
    
    while page < max_pages:
        print(f"[p] Fetching page {page + 1}...", end=" ")
        
        result = fetch_algolia_jobs(page=page)
        hits = result.get("hits", [])
        total_hits = result.get("nbHits", 0)
        total_pages = result.get("nbPages", 0)
        
        if not hits:
            print("No more results.")
            break
        
        print(f"Got {len(hits)} jobs (Total: {total_hits}, Pages: {total_pages})")
        
        # Map and collect jobs
        for hit in hits:
            job = map_algolia_hit_to_job(hit)
            all_jobs.append(job)
            
            # Save to Supabase incrementally
            if save_to_db and supabase:
                try:
                    supabase.table("jobs").upsert(
                        job, 
                        on_conflict="external_id"
                    ).execute()
                except Exception as e:
                    print(f"   [!] DB upsert error: {e}")
        
        page += 1
        
        # Check if we've reached the last page
        if page >= total_pages:
            print("[OK] Reached last page.")
            break
    
    print("-" * 50)
    print(f"[OK] Scraping complete! Total jobs: {len(all_jobs)}")
    
    # Export to JSON if no DB save
    if not save_to_db or not supabase:
        output_file = os.path.join(root_dir, "jobs_scraped.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(all_jobs, f, ensure_ascii=False, indent=2)
        print(f"[OK] Exported to: {output_file}")
    
    return all_jobs


def preview_jobs(limit: int = 5):
    """
    Quick preview of Algolia data without saving to DB.
    Useful for testing the API connection.
    """
    print("[?] Preview Mode (No DB save)")
    print("=" * 50)
    
    result = fetch_algolia_jobs(page=0, hits_per_page=limit)
    hits = result.get("hits", [])
    
    if not hits:
        print("[X] No jobs found. Check API credentials.")
        return
    
    print(f"Found {result.get('nbHits', 0)} total jobs. Showing first {len(hits)}:\n")
    
    for i, hit in enumerate(hits, 1):
        job = map_algolia_hit_to_job(hit)
        print(f"[{i}] {job['title']}")
        print(f"    [c] {job['company_name']}")
        print(f"    [L] {job['location']}")
        print(f"    [D] {job['contract_type']}")
        print(f"    [U] {job['apply_url'][:60]}..." if len(job['apply_url']) > 60 else f"    [U] {job['apply_url']}")
        print(f"    [I]  Logo: {'Yes' if job['logo_url'] else 'No'}")
        print()
    
    # Show raw sample for debugging
    print("=" * 50)
    print("[B] Raw Algolia Hit Sample (First Job):")
    print(json.dumps(hits[0], indent=2, ensure_ascii=True)[:2000])


# ============================================================
# CLI ENTRY POINT
# ============================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Algolia API Scraper for Station F Jobs")
    parser.add_argument("--preview", action="store_true", help="Preview mode (no DB save)")
    parser.add_argument("--limit", type=int, default=5, help="Number of jobs to preview")
    parser.add_argument("--max-pages", type=int, default=100, help="Max pages to scrape")
    parser.add_argument("--no-save", action="store_true", help="Don't save to database")
    
    args = parser.parse_args()
    
    if args.preview:
        preview_jobs(limit=args.limit)
    else:
        scrape_all_jobs(max_pages=args.max_pages, save_to_db=not args.no_save)
