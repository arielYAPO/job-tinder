#!/usr/bin/env python3
"""
Import scraped jobs from JSON file to Supabase.
"""

import json
import os
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def load_jobs(filepath: str) -> list:
    """Load jobs from JSON file."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def map_to_supabase_schema(job: dict) -> dict:
    """Map scraped job to Supabase jobs table schema."""
    return {
        "external_id": job.get("external_id"),
        "title": job.get("title"),
        "company_name": job.get("company_name"),
        "company_slug": job.get("company_slug"),
        "logo_url": job.get("logo_url"),
        "contract_type": job.get("contract_type"),
        "location": job.get("location"),
        "published_at": job.get("published_at"),
        "apply_url": job.get("apply_url"),
        "job_description": job.get("job_description"),
        "department": job.get("department"),
        "source": "algolia_stationf",  # Standardize source
        "scraped_at": job.get("scraped_at"),
        "is_active": True,
    }

def import_jobs(jobs: list, supabase: Client, batch_size: int = 100):
    """Import jobs to Supabase in batches."""
    total = len(jobs)
    imported = 0
    errors = 0
    
    for i in range(0, total, batch_size):
        batch = jobs[i:i + batch_size]
        batch_mapped = [map_to_supabase_schema(job) for job in batch]
        
        try:
            # Upsert using external_id as unique key
            result = supabase.table("jobs").upsert(
                batch_mapped,
                on_conflict="external_id"
            ).execute()
            
            imported += len(batch_mapped)
            print(f"[+] Imported batch {i//batch_size + 1}: {len(batch_mapped)} jobs ({imported}/{total})")
            
        except Exception as e:
            errors += len(batch_mapped)
            print(f"[!] Error importing batch {i//batch_size + 1}: {str(e)}")
    
    return imported, errors

def main():
    print("=" * 50)
    print("Job Import to Supabase")
    print("=" * 50)
    
    # Check environment
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("[X] Error: SUPABASE_URL and SUPABASE_KEY must be set in .env")
        return
    
    print(f"[>] Supabase URL: {SUPABASE_URL[:30]}...")
    
    # Initialize Supabase client
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("[+] Supabase client initialized")
    
    # Load jobs
    jobs_file = os.path.join(os.path.dirname(__file__), "jobs_scraped.json")
    if not os.path.exists(jobs_file):
        print(f"[X] Error: {jobs_file} not found")
        return
    
    jobs = load_jobs(jobs_file)
    print(f"[+] Loaded {len(jobs)} jobs from JSON")
    
    # Import jobs
    print("-" * 50)
    print("[>] Starting import...")
    imported, errors = import_jobs(jobs, supabase)
    
    print("-" * 50)
    print(f"[=] Import complete!")
    print(f"    - Imported: {imported}")
    print(f"    - Errors: {errors}")
    
if __name__ == "__main__":
    main()
