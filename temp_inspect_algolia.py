
import sys
import os
import json

# Add current dir to path to import browser-use modules if needed, 
# but we can just copy-paste the minimal code to fetch data or import if path allows.
# easier to just import from browser-use.algolia_scraper

sys.path.append(os.getcwd())

from browser_use.algolia_scraper import fetch_algolia_jobs

def inspect():
    result = fetch_algolia_jobs(page=0, hits_per_page=1)
    hits = result.get("hits", [])
    if hits:
        org = hits[0].get("organization", {})
        print(json.dumps(org, indent=2))
    else:
        print("No hits found")

if __name__ == "__main__":
    inspect()
