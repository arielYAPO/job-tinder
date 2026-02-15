import asyncio
import os
from dotenv import load_dotenv
from supabase import create_client
from algolia_scraper import scrape_all_jobs

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def refresh_jobs():
    print("[*] Starting Station F Job Refresh (via Algolia API)...")

    # 1. Scrape fresh data (Get list, don't auto-save yet to control the logic)
    # We set save_to_db=False because we want to handle the upsert manually to ensure flags are correct
    print("[*] Fetching jobs from Algolia...")
    scraped_jobs = scrape_all_jobs(max_pages=100, save_to_db=False)
    print(f"[+] Fetched {len(scraped_jobs)} jobs from Algolia.")

    # 2. Get existing active jobs from DB (source = algolia_stationf or stationf)
    print("[*] Fetching existing active jobs from DB...")
    # Fetch IDs and external_ids
    resp = supabase.table("jobs").select("id, external_id").eq("is_active", True).execute()
    existing_jobs = resp.data or []
    
    # Map external_id -> db_id
    # We prioritize external_id. If missing, we might have issues matching, but Algolia jobs have it.
    existing_map = {job["external_id"]: job["id"] for job in existing_jobs if job.get("external_id")}
    print(f"[+] Found {len(existing_jobs)} active jobs in DB.")

    # 3. Identify Missing Jobs
    scraped_ids = {job["external_id"] for job in scraped_jobs if job.get("external_id")}
    missing_ids = set(existing_map.keys()) - scraped_ids
    
    print(f"[*] Analysis:")
    print(f"   - Scraped: {len(scraped_ids)}")
    print(f"   - Existing: {len(existing_map)}")
    print(f"   - Missing (to be flagged): {len(missing_ids)}")

    # 4. Mark missing jobs as potentially_expired
    if missing_ids:
        db_ids_to_flag = [existing_map[ext_id] for ext_id in missing_ids]
        print(f"[!] Flagging {len(db_ids_to_flag)} jobs as 'potentially_expired'...")
        
        # Split into batches of 100
        batch_size = 100
        for i in range(0, len(db_ids_to_flag), batch_size):
            batch = db_ids_to_flag[i:i + batch_size]
            try:
                supabase.table("jobs").update({
                    "potentially_expired": True,
                    # We KEEP is_active=True as requested ("on les garde")
                    "last_checked_at": "now()"
                }).in_("id", batch).execute()
            except Exception as e:
                print(f"   [!] Error flagging batch {i}: {e}")
                
        print(f"[+] Flagging complete.")

    # 5. Upsert Scraped Jobs (Active & Safe)
    print("[*] Upserting fresh jobs...")
    
    jobs_to_upsert = []
    for job in scraped_jobs:
        # Enforce flags
        job["is_active"] = True
        job["potentially_expired"] = False
        job["last_checked_at"] = "now()"
        # Ensure source is consistent
        job["source"] = "algolia_stationf"
        
        jobs_to_upsert.append(job)

    # Batch upsert
    upserted_count = 0
    errors = 0
    batch_size = 100
    
    for i in range(0, len(jobs_to_upsert), batch_size):
        batch = jobs_to_upsert[i:i + batch_size]
        try:
            # Upsert on external_id
            supabase.table("jobs").upsert(batch, on_conflict="external_id").execute()
            upserted_count += len(batch)
            print(f"   [+] Batch {i//batch_size + 1} upserted ({len(batch)} jobs)")
        except Exception as e:
            print(f"   [!] Error upserting batch {i//batch_size + 1}: {e}")
            errors += 1

    print("-" * 50)
    print("[+] Refresh Complete.")
    print(f"   - Upserted/Updated: {upserted_count}")
    print(f"   - Flagged Expired: {len(missing_ids)}")
    print(f"   - Errors: {errors}")

if __name__ == "__main__":
    refresh_jobs()

