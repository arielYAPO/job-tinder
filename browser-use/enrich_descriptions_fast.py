"""
Fast Job Description Enricher
------------------------------
Scrapes job descriptions from JSON-LD tags embedded in job posting pages.
This is the "API" that WTTJ hides in their HTML for Google SEO.

Usage:
    python enrich_descriptions_fast.py [--limit N] [--dry-run]

Cost: 0€ (no Gemini, no Playwright)
Speed: ~100-500ms per job
"""

import os
import sys
import json
import time
import argparse
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[ERROR] Missing SUPABASE_URL or SUPABASE_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- THE MAGIC FUNCTION ---

def get_job_description_fast(url: str) -> dict:
    """
    Simule une API : Telecharge le HTML leger et extrait le JSON-LD cache.
    Cost: 0 euros
    Speed: < 1 seconde
    
    Returns dict with 'description', 'title', 'company', etc. or None on failure.
    """
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    try:
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        
        if response.status_code != 200:
            return {"error": f"HTTP {response.status_code}"}

        soup = BeautifulSoup(response.text, 'html.parser')

        # Look for JSON-LD structured data (Google SEO standard)
        script_tags = soup.find_all("script", type="application/ld+json")
        
        for script_tag in script_tags:
            try:
                data = json.loads(script_tag.string)
                
                # Handle list or single object
                if isinstance(data, list):
                    for item in data:
                        if item.get("@type") == "JobPosting":
                            return extract_job_fields(item)
                elif data.get("@type") == "JobPosting":
                    return extract_job_fields(data)
            except json.JSONDecodeError:
                continue
        
        # Fallback: Try to extract from meta tags or visible content
        return extract_from_meta(soup)
            
    except requests.exceptions.Timeout:
        return {"error": "Timeout"}
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Unexpected: {e}"}


def extract_job_fields(job_data: dict) -> dict:
    """Extract relevant fields from JSON-LD JobPosting."""
    description = job_data.get("description", "")
    
    # Clean HTML from description if present
    if description and "<" in description:
        soup = BeautifulSoup(description, 'html.parser')
        description = soup.get_text(separator="\n").strip()
    
    return {
        "description": description,
        "title": job_data.get("title"),
        "company": job_data.get("hiringOrganization", {}).get("name") if isinstance(job_data.get("hiringOrganization"), dict) else None,
        "location": job_data.get("jobLocation", {}).get("address", {}).get("addressLocality") if isinstance(job_data.get("jobLocation"), dict) else None,
        "employment_type": job_data.get("employmentType"),
        "date_posted": job_data.get("datePosted"),
    }


def extract_from_meta(soup: BeautifulSoup) -> dict:
    """Fallback: Extract from meta tags if JSON-LD not found."""
    description = None
    
    # Try og:description
    og_desc = soup.find("meta", property="og:description")
    if og_desc:
        description = og_desc.get("content", "")
    
    # Try meta description
    if not description:
        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            description = meta_desc.get("content", "")
    
    if description:
        return {"description": description, "source": "meta"}
    
    return {"error": "No JSON-LD or meta description found"}


# --- MAIN ENRICHMENT LOGIC ---

def enrich_jobs(limit: int = 50, dry_run: bool = False):
    """
    Fetch jobs with missing/short descriptions and enrich them.
    """
    print(f"\n{'='*60}")
    print("FAST JOB DESCRIPTION ENRICHER")
    print(f"{'='*60}")
    print(f"Mode: {'DRY RUN' if dry_run else 'LIVE'}")
    print(f"Limit: {limit}")
    print()

    # Fetch all jobs (we'll filter in Python for more control)
    resp = supabase.table("jobs").select("id, title, company_name, apply_url, job_description").execute()
    
    all_jobs = resp.data or []
    
    # Filter to jobs needing enrichment
    jobs_to_enrich = []
    for job in all_jobs:
        desc = job.get("job_description") or ""
        url = job.get("apply_url") or ""
        
        # Skip if no URL
        if not url:
            continue
            
        # Skip if description is already substantial (> 100 chars)
        if len(desc) > 100:
            continue
        
        # Only process WTTJ URLs for now (can extend later)
        if "welcometothejungle" not in url.lower() and "wttj" not in url.lower():
            continue
            
        jobs_to_enrich.append(job)
    
    print(f"[*] Found {len(all_jobs)} total jobs")
    print(f"[*] Found {len(jobs_to_enrich)} jobs needing enrichment (WTTJ URLs)")
    print()
    
    if not jobs_to_enrich:
        print("[OK] All jobs already have descriptions!")
        return
    
    # Process up to limit
    to_process = jobs_to_enrich[:limit]
    
    success_count = 0
    error_count = 0
    
    for i, job in enumerate(to_process, 1):
        job_id = job["id"]
        # Sanitize for Windows console (remove emojis/special chars)
        title = job.get("title", "Unknown")[:40].encode('ascii', 'ignore').decode('ascii')
        company = job.get("company_name", "Unknown")[:20].encode('ascii', 'ignore').decode('ascii')
        url = job["apply_url"]
        
        print(f"[{i}/{len(to_process)}] {title} @ {company}")
        print(f"    URL: {url[:60]}...")
        
        # Scrape the description
        result = get_job_description_fast(url)
        
        if "error" in result:
            print(f"    [X] Error: {result['error']}")
            error_count += 1
            continue
        
        description = result.get("description", "")
        
        if not description or len(description) < 50:
            print(f"    [X] Description too short ({len(description)} chars)")
            error_count += 1
            continue
        
        print(f"    [OK] Got {len(description)} chars")
        
        if not dry_run:
            # Update database
            try:
                supabase.table("jobs").update({
                    "job_description": description
                }).eq("id", job_id).execute()
                print(f"    [OK] Updated in DB")
                success_count += 1
            except Exception as e:
                print(f"    [X] DB Error: {e}")
                error_count += 1
        else:
            print(f"    [DRY RUN] Would update DB")
            success_count += 1
        
        # Small delay to be nice to the server
        time.sleep(0.3)
    
    print()
    print(f"{'='*60}")
    print(f"DONE!")
    print(f"  Success: {success_count}")
    print(f"  Errors: {error_count}")
    print(f"{'='*60}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Fast job description enricher using JSON-LD")
    parser.add_argument("--limit", type=int, default=50, help="Max jobs to process")
    parser.add_argument("--dry-run", action="store_true", help="Don't update DB, just preview")
    
    args = parser.parse_args()
    
    enrich_jobs(limit=args.limit, dry_run=args.dry_run)
