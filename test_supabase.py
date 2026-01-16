
import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv('.env.local') # Try root env directly

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

print(f"URL: {url}")
print(f"Key found: {'Yes' if key else 'No'}")

if not url or not key:
    print("Missing credentials")
    exit(1)

supabase: Client = create_client(url, key)

try:
    test_data = {
        "external_id": "test-id-" + str(os.getpid()),
        "title": "Test Job",
        "company_name": "Test Co",
        "source": "stationf",
        "sector": "Tech",
        "stack": ["Python", "Supabase"],
        "pitch": "This is a test pitch",
        "location": "Test Location"
    }
    
    print("Attempting to insert...")
    response = supabase.table('jobs').upsert(test_data, on_conflict='external_id').execute()
    print("Success!", response.data)
except Exception as e:
    print("Error:", e)
