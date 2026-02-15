
import requests
import json

ALGOLIA_APP_ID = "CSEKHVMS53"
ALGOLIA_API_KEY = "ZTQzYjA0MGViZWQ5YmU0YWRkMjQ0ODhlYmFiOGNiOTU1MmVmMmExZDFkMDI2MjNmMGExNTA1OTdlMjM4ZDlhN2ZpbHRlcnM9d2Vic2l0ZS5yZWZlcmVuY2UlM0FzdGF0aW9uLWYtam9iLWJvYXJk"
# Trying to guess the index name based on naming convention
ALGOLIA_INDEX = "wk_cms_companies_production" 
ALGOLIA_ENDPOINT = f"https://{ALGOLIA_APP_ID.lower()}-dsn.algolia.net/1/indexes/*/queries"

ALGOLIA_HEADERS = {
    "X-Algolia-Application-Id": ALGOLIA_APP_ID,
    "X-Algolia-API-Key": ALGOLIA_API_KEY,
    "Content-Type": "application/json"
}

def check_company():
    # Searching for "L'Oréal" or the slug
    payload = {
        "requests": [
            {
                "indexName": ALGOLIA_INDEX,
                "query": "L'Oréal",
                "params": "hitsPerPage=1"
            }
        ]
    }
    
    try:
        response = requests.post(ALGOLIA_ENDPOINT, headers=ALGOLIA_HEADERS, json=payload)
        data = response.json()
        print(json.dumps(data, indent=2))
    except Exception as e:
        print(e)

if __name__ == "__main__":
    check_company()
