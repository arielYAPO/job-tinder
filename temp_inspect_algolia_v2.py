
import requests
import json

ALGOLIA_APP_ID = "CSEKHVMS53"
ALGOLIA_API_KEY = "ZTQzYjA0MGViZWQ5YmU0YWRkMjQ0ODhlYmFiOGNiOTU1MmVmMmExZDFkMDI2MjNmMGExNTA1OTdlMjM4ZDlhN2ZpbHRlcnM9d2Vic2l0ZS5yZWZlcmVuY2UlM0FzdGF0aW9uLWYtam9iLWJvYXJk"
ALGOLIA_INDEX = "wk_cms_jobs_production_careers"
ALGOLIA_ENDPOINT = f"https://{ALGOLIA_APP_ID.lower()}-dsn.algolia.net/1/indexes/*/queries"

ALGOLIA_HEADERS = {
    "X-Algolia-Application-Id": ALGOLIA_APP_ID,
    "X-Algolia-API-Key": ALGOLIA_API_KEY,
    "Content-Type": "application/json"
}

def inspect():
    payload = {
        "requests": [
            {
                "indexName": ALGOLIA_INDEX,
                "params": "hitsPerPage=1&page=0"
            }
        ]
    }
    
    response = requests.post(ALGOLIA_ENDPOINT, headers=ALGOLIA_HEADERS, json=payload)
    data = response.json()
    hits = data.get("results", [{}])[0].get("hits", [])
    
    if hits:
        print("Website field:")
        print(json.dumps(hits[0].get("website"), indent=2))
        
        print("\nOrganization field:")
        org = hits[0].get("organization", {})
        print(json.dumps(org, indent=2))
    else:
        print("No hits found")

if __name__ == "__main__":
    inspect()
