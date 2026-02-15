
import requests
import json

def test_api():
    url = "http://localhost:3000/api/contact"
    payload = {
        "company": "OVRSEA",
        "job": "CTO",
        "domain": "ovrsea.com"
    }
    
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print("Response JSON:")
        print(json.dumps(response.json(), indent=2))
        
        if response.status_code == 200 and response.json().get("success"):
            print("✅ API Test Passed!")
        else:
            print("❌ API Test Failed.")
            
    except Exception as e:
        print(f"Error connecting to API: {e}")
        print("Make sure your Next.js server is running on port 3000!")

if __name__ == "__main__":
    test_api()
