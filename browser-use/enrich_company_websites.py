
import os
import time
from dotenv import load_dotenv
from supabase import create_client
from serper_contact_finder import find_company_website

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use Service Role for writes

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Missing Supabase credentials in .env")

# Initialize Supabase client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def enrich_websites():
    print("Starting batch enrichment for company websites...")
    
    # 1. Fetch jobs where company_url is NULL
    # We select distinct company_names to avoid duplicate API calls
    response = supabase.table("jobs") \
        .select("company_name") \
        .is_("company_url", "null") \
        .limit(1500) \
        .execute()
        
    jobs_to_process = response.data
    
    # Deduplicate companies to save credits
    unique_companies = list(set([j["company_name"] for j in jobs_to_process if j["company_name"]]))
    
    print(f"Found {len(jobs_to_process)} jobs with missing URLs.")
    print(f"Unique companies to search: {len(unique_companies)}")
    
    if not unique_companies:
        print("No companies to enrich.")
        return

    # 2. Iterate and enrich
    count = 0
    for company in unique_companies:
        try:
            print(f"[{count+1}/{len(unique_companies)}] Searching for: {company}...")
            
            # Call our Serper function
            domain = find_company_website(company)
            
            if domain:
                # 3. Update ALL jobs for this company
                # We store the FULL domain (e.g. "ovrsea.com") in company_url
                supabase.table("jobs") \
                    .update({"company_url": domain}) \
                    .eq("company_name", company) \
                    .execute()
                
                print(f"   Updated: {domain}")
            else:
                # Mark as NOT_FOUND to avoid re-processing and wasting credits
                supabase.table("jobs") \
                    .update({"company_url": "NOT_FOUND"}) \
                    .eq("company_name", company) \
                    .execute()
                print(f"   Not found. Marked as NOT_FOUND.")
                
            count += 1
            # Rate limiting safe buffer
            time.sleep(0.5) 
            
        except Exception as e:
            print(f"   Error processing {company}: {e}")

    print("Enrichment complete!")

if __name__ == "__main__":
    enrich_websites()
