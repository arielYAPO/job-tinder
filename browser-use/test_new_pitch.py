"""
Test du nouveau prompt "Analyste VC" sur quelques jobs existants.
Compare l'ancien pitch (DuckDuckGo) vs le nouveau (job_description).
"""
import asyncio
import json
import os
from dotenv import load_dotenv
from supabase import create_client
import google.generativeai as genai

# Load env
load_dotenv(".env")
load_dotenv("../.env.local")

# Setup
api_key = os.getenv("GOOGLE_API_KEY")
supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

genai.configure(api_key=api_key)
model = genai.GenerativeModel("gemini-2.5-flash")
supabase = create_client(supabase_url, supabase_key)


def extract_json_object(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1:
        return "{}"
    return text[start:end+1]


async def analyze_with_new_prompt(company: str, full_job_text: str) -> dict:
    """
    Le nouveau prompt "Analyste VC" - utilise le texte complet de l'offre
    """
    text_sample = (full_job_text or "")[:5000]
    
    prompt = f"""
You are a Tech Analyst for a Venture Capital firm.
Your goal is to analyze a startup based on one of their job descriptions.

INPUT TEXT (Job Description):
{text_sample}

INSTRUCTIONS:
1. Ignore the specific job details (salary, daily tasks).
2. Find the "About Us" or context section to understand the company's product.
3. Extract the real tech stack if mentioned (look for keywords like Python, React, AWS, etc.).
4. Write a "Techno-Functional Pitch": Explain WHAT they sell and TO WHOM (B2B/B2C) and roughly HOW (Tech).

CONSTRAINT:
- Pitch must be brutally honest and concrete. No marketing fluff ("We change the world"). 
- Example of GOOD Pitch: "B2B SaaS platform for accountants to automate VAT declarations using OCR."
- Example of BAD Pitch: "We are a human-centric family revolutionizing finance."

Return ONLY valid JSON:
{{
  "sector": "string (Specific: e.g. Fintech/Accounting, HealthTech/SaaS)",
  "stack": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "pitch": "The concrete techno-functional pitch (max 180 chars)"
}}
"""
    
    try:
        res = model.generate_content(prompt)
        raw = getattr(res, "text", str(res))
        data = json.loads(extract_json_object(raw))
        return data
    except Exception as e:
        return {"error": str(e)}


async def main():
    # Récupère 3 jobs avec job_description
    resp = supabase.table("jobs")\
        .select("company_name, title, pitch, sector, stack, job_description")\
        .eq("source", "stationf")\
        .not_.is_("job_description", "null")\
        .limit(3)\
        .execute()
    
    jobs = resp.data or []
    
    print("=" * 60)
    print("TEST: Ancien Pitch (DuckDuckGo) vs Nouveau Pitch (Job Text)")
    print("=" * 60)
    
    for job in jobs:
        company = job.get("company_name", "Unknown")
        title = job.get("title", "")
        old_pitch = job.get("pitch", "N/A")
        old_sector = job.get("sector", "N/A")
        job_text = job.get("job_description", "")
        
        print(f"\n[COMPANY] {company} - {title[:40]}...")
        print("-" * 50)
        
        print(f"ANCIEN (DuckDuckGo):")
        print(f"   Sector: {old_sector}")
        print(f"   Pitch:  {old_pitch}")
        
        # Nouveau prompt
        new_result = await analyze_with_new_prompt(company, job_text)
        
        print(f"\nNOUVEAU (Job Description):")
        print(f"   Sector: {new_result.get('sector', 'N/A')}")
        print(f"   Stack:  {new_result.get('stack', [])}")
        print(f"   Pitch:  {new_result.get('pitch', 'N/A')}")
        
        if new_result.get("error"):
            print(f"   ERROR: {new_result['error']}")
        
        print()

if __name__ == "__main__":
    asyncio.run(main())
