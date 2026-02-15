"""
Met à jour les 3 cartes modèles avec les nouveaux pitchs/stacks générés.
"""
import os
from dotenv import load_dotenv
from supabase import create_client

# Load env
load_dotenv(".env")
load_dotenv("../.env.local")

supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(supabase_url, supabase_key)

# Les 3 cartes modeles avec les nouvelles donnees du test
UPDATED_CARDS = [
    {
        "company_name": "ShareID",
        "sector": "RegTech/Identity Verification",
        "stack": ["Python", "FastAPI", "PostgreSQL", "RabbitMQ", "Docker", "GCP/AWS", "AI", "Biometrics"],
        "pitch": "B2B SaaS platform providing real-time identity verification for companies, leveraging biometrics, AI, and cryptography."
    },
    {
        "company_name": "Maquette l oreal beauty tech",
        "sector": "Cosmetics / Industrial Design & R&D",
        "stack": ["Keyshot", "Rhino", "Solidworks", "AI Tools", "Rapid Prototyping"],
        "pitch": "B2C cosmetic brands designing and prototyping innovative, sustainable packaging using industrial design software."
    },
    {
        "company_name": "Sekoia.io",
        "sector": "Cybersecurity/SaaS",
        "stack": ["AWS", "Azure", "GCP", "Python", "SIEM", "XDR"],
        "pitch": "B2B SaaS platform providing Cyber Threat Intelligence (CTI) and XDR/SIEM solutions for large enterprises."
    }
]

def update_cards():
    print("Mise a jour des 3 cartes modeles...")
    print("=" * 50)
    
    for card in UPDATED_CARDS:
        company = card["company_name"]
        
        # Update in DB
        result = supabase.table("jobs")\
            .update({
                "sector": card["sector"],
                "stack": card["stack"],
                "pitch": card["pitch"]
            })\
            .eq("company_name", company)\
            .eq("source", "stationf")\
            .execute()
        
        count = len(result.data) if result.data else 0
        print(f"[OK] {company}: {count} jobs mis a jour")
        print(f"     Sector: {card['sector']}")
        print(f"     Stack:  {card['stack'][:4]}...")
        print(f"     Pitch:  {card['pitch'][:60]}...")
        print()
    
    print("=" * 50)
    print("DONE! Rafraichis ta page pour voir les changements.")

if __name__ == "__main__":
    update_cards()
