import requests
import os
import re
from unidecode import unidecode
from dotenv import load_dotenv

load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")

if not SERPER_API_KEY:
    raise ValueError("SERPER_API_KEY not found in environment variables")

def search_linkedin_contact(company_name: str, job_title: str) -> str:
    """
    Cherche le nom du contact sur LinkedIn via Google Dork.
    Retourne le nom complet nettoyé ou un message d'erreur.
    """
    url = "https://google.serper.dev/search"
    query = f"site:fr.linkedin.com/in/ {company_name} {job_title}"
    
    payload = {
        "q": query,
    }
    
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        
        data = response.json()
        
        if "organic" in data and len(data["organic"]) > 0:
            first_title = data["organic"][0]["title"]
            
            # Regex : coupe sur le tiret (-) OU le pipe (|)
            fullname = re.split(r'[-|]', first_title)[0].strip()
            
            return fullname
        else:
            return "Aucun résultat trouvé."
            
    except requests.exceptions.RequestException as e:
        return f"Erreur API : {e}"



def generate_email(fullname: str, domain_name: str) -> str:
    # 1. Nettoyage radical : on enleve les accents et on met en minuscule
    # "Jerome Cote" -> "jerome cote"
    clean_name = unidecode(fullname).lower().strip()
    
    # 2. Decoupage intelligent
    parts = clean_name.split()
    
    if not parts:
        return "" # Cas improbable ou le nom est vide
        
    firstname = parts[0]
    
    # 3. Gestion du Nom de Famille (Piege 2 : les noms composes)
    if len(parts) > 1:
        # On recolle tout le reste (sauf le prenom) sans espace
        # Ex: ["arthur", "barillas", "de", "fleury"] -> lastname = "barillasdefleury"
        lastname = "".join(parts[1:]) 
        return f"{firstname}.{lastname}@{domain_name}"
    else:
        # 4. Fallback (Piege 1 : un seul nom)
        # Ex: "Zendaya" -> "zendaya@domain.com"
        return f"{firstname}@{domain_name}"



def find_company_website(company_name: str) -> str:
    """
    Trouve le site web officiel d'une entreprise via Google.
    """
    url = "https://google.serper.dev/search"
    query = f"{company_name} official website"
    
    payload = {
        "q": query,
    }
    
    headers = {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
    }

    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        data = response.json()
        
        # On prend le premier résultat organique
        if "organic" in data and len(data["organic"]) > 0:
            link = data["organic"][0]["link"]
            
            # Petite extraction du domaine propre
            from urllib.parse import urlparse
            parsed_url = urlparse(link)
            domain = parsed_url.netloc.replace("www.", "")
            return domain
        return None
    except Exception as e:
        print(f"Erreur recherche site : {e}")
        return None


# --- MAIN ---
if __name__ == "__main__":
    company = "OVRSEA"
    job = "CTO"
    
    # Test du fallback : on fait semblant de ne pas avoir le domaine
    domain = None 

    if not domain:
        print(f"Recherche du site web pour {company}...")
        domain = find_company_website(company)
        
        if domain:
            print(f"   -> Trouve : {domain}")
        else:
            print("   -> Site non trouve, on ne pourra pas generer l'email.")

    if domain:
        print(f"Recherche du {job} chez {company}...")
        found_name = search_linkedin_contact(company, job)

        if found_name and "Aucun résultat" not in found_name and "Erreur" not in found_name:
            print(f"Nom trouve : {found_name}")
            
            email = generate_email(found_name, domain)
            print(f"Email genere : {email}")
        else:
            print(f"Echec : {found_name}")