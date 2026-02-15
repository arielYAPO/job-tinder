"""
find_contact.py - Contact Finder Pipeline
==========================================
Pipeline :
  1. DDG Search -> Domaine commercial (ovrsea.com)
  2. Pappers API -> CEO / President (Arthur Barillas)
  3. Email Permutation -> arthur.barillas@ovrsea.com

Usage:
    python find_contact.py "OVRSEA"
    python find_contact.py "Mistral AI" --domain mistral.ai
"""

import os
import sys
import dns.resolver
import smtplib
import requests
import re
import unicodedata
from urllib.parse import urlparse
from typing import List, Optional, Dict
from dotenv import load_dotenv
from ddgs import DDGS

# ============================================================
# 0. CONFIG
# ============================================================
script_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(script_dir, ".env"))

PAPPERS_API_TOKEN = os.getenv("PAPPERS_API_TOKEN")

# Domains to ignore when hunting for the real company site
DOMAIN_BLACKLIST = [
    "linkedin.com", "facebook.com", "instagram.com", "twitter.com",
    "societe.com", "pappers.fr", "verif.com", "youtube.com",
    "wikipedia.org", "crunchbase.com", "glassdoor.com", "indeed.com",
    "google.com", "bing.com", "tiktok.com", "welcometothejungle.com",
]


# ============================================================
# 1. DOMAIN HUNTER (DDG) - Trouver le domaine commercial
# ============================================================
def get_company_domain(brand_name: str) -> Optional[str]:
    """
    Cherche le site officiel de la boite via DuckDuckGo pour extraire
    son nom de domaine commercial.
    Ex: "OVRSEA" -> "ovrsea.com"
    """
    print(f"[DDG] Recherche du domaine pour : {brand_name}...")

    clean_brand = re.sub(r'[^a-zA-Z0-9]', '', brand_name).lower()

    queries = [
        f"{brand_name} site officiel",
        f"{brand_name} official website",
        f"{brand_name}",
    ]

    try:
        with DDGS() as ddgs:
            for query in queries:
                results = list(ddgs.text(query, max_results=10))

                for r in results:
                    url = r.get("href", "")
                    parsed = urlparse(url)
                    domain = parsed.netloc.lower()

                    if domain.startswith("www."):
                        domain = domain[4:]

                    if any(bl in domain for bl in DOMAIN_BLACKLIST):
                        continue

                    if not domain or "." not in domain:
                        continue

                    # Validate: the domain should contain the brand name (or be very close)
                    domain_base = domain.split(".")[0]
                    if clean_brand in domain_base or domain_base in clean_brand:
                        print(f"[OK] Domaine identifie : {domain}")
                        return domain

    except Exception as e:
        print(f"[X] Erreur Domain Hunter : {e}")

    print(f"[X] Domaine introuvable pour '{brand_name}'")
    return None


# ============================================================
# 1b. DDG CEO FINDER - Fallback quand Pappers ne donne pas le CEO
# ============================================================
def find_ceo_from_ddg(company_name: str) -> Optional[Dict]:
    """
    Cherche le CEO/fondateur d'une entreprise via DuckDuckGo.
    Focuses on LinkedIn results which have predictable title format:
      "Prenom Nom - Titre - Entreprise | LinkedIn"
    """
    print(f"[DDG-CEO] Recherche du CEO pour : {company_name}...")

    queries = [
        f"site:linkedin.com/in {company_name} CEO",
        f"site:linkedin.com/in {company_name} founder",
        f"site:linkedin.com/in {company_name} fondateur",
        f"{company_name} CEO founder name",
    ]

    try:
        with DDGS() as ddgs:
            for query in queries:
                results = list(ddgs.text(query, max_results=5))

                for r in results:
                    title = r.get("title", "")
                    body = r.get("body", "")

                    # Try LinkedIn title parsing first
                    # Format: "Prenom Nom - Titre - Entreprise | LinkedIn"
                    name = _parse_linkedin_title(title, company_name)
                    if name:
                        parts = name.split()
                        if len(parts) >= 2:
                            prenom = parts[0]
                            nom = " ".join(parts[1:])
                            print(f"[OK] CEO trouve via LinkedIn DDG : {prenom} {nom}")
                            return {
                                "prenom": prenom,
                                "nom": nom,
                                "qualite": "CEO/Fondateur (DDG)",
                                "full_name": name,
                                "nom_entreprise": company_name,
                                "siren": None,
                                "site_web": None,
                                "ceo_found": True
                            }

                    # Fallback: try regex on combined text
                    combined = f"{title} {body}"
                    name = _extract_person_name(combined, company_name)
                    if name:
                        parts = name.split()
                        if len(parts) >= 2:
                            prenom = parts[0]
                            nom = " ".join(parts[1:])
                            print(f"[OK] CEO trouve via DDG : {prenom} {nom}")
                            return {
                                "prenom": prenom,
                                "nom": nom,
                                "qualite": "CEO/Fondateur (DDG)",
                                "full_name": name,
                                "nom_entreprise": company_name,
                                "siren": None,
                                "site_web": None,
                                "ceo_found": True
                            }

    except Exception as e:
        print(f"[X] Erreur DDG CEO : {e}")

    print("[X] CEO introuvable via DDG.")
    return None


def _parse_linkedin_title(title: str, company_name: str) -> Optional[str]:
    """
    Parses LinkedIn search result titles.
    Expected format: "Prenom Nom - Titre - Entreprise | LinkedIn"
    Returns the person name if the title mentions a relevant role.
    """
    if not title:
        return None

    # Remove " | LinkedIn" suffix
    clean = re.sub(r'\s*[\|\-]\s*LinkedIn\s*$', '', title, flags=re.IGNORECASE).strip()

    # Split by " - " to get parts
    parts = [p.strip() for p in re.split(r'\s*-\s*', clean)]

    if len(parts) < 2:
        return None

    # First part is usually the name
    candidate_name = parts[0]

    # Check if any other part mentions a CEO-like role
    role_keywords = ['ceo', 'cto', 'coo', 'founder', 'co-founder', 'fondateur',
                     'president', 'directeur', 'dirigeant', 'chief']
    rest = ' '.join(parts[1:]).lower()
    has_role = any(kw in rest for kw in role_keywords)

    if not has_role:
        return None

    # Validate the name: should be 2-3 capitalized words, no blacklisted words
    name_words = candidate_name.split()
    if len(name_words) < 2 or len(name_words) > 4:
        return None

    # Each word should start with uppercase and have 2+ chars
    for w in name_words:
        if len(w) < 2 or not w[0].isupper():
            return None

    return candidate_name


def _extract_person_name(text: str, company_name: str) -> Optional[str]:
    """
    Tries to extract a person's name from a search result snippet.
    Looks for patterns like 'Firstname Lastname' near CEO/founder keywords.
    """
    # Words that look like names but aren't
    word_blacklist = {
        "ceo", "cto", "coo", "cfo", "vp", "svp", "evp",
        "founder", "fondateur", "president", "dirigeant",
        "director", "directeur", "manager", "chief",
        "the", "and", "our", "his", "her", "its",
        "sur", "les", "des", "par", "est",
    }

    # Trigger words (case-insensitive match for these)
    trigger = r'(?:CEO|CTO|COO|CFO|founder|co-founder|fondateur|co-fondateur|dirigeant|pr[eé]sident)'

    # Name pattern: 2-3 capitalized words, each at least 3 chars (avoids acronyms)
    # This pattern is CASE-SENSITIVE to only match proper names
    name_pat = r'([A-Z][a-z]{2,}(?:\s+[A-Z][a-z]{2,}){1,2})'

    # Pattern 1: "Name - CEO" / "Name, founder"
    for match in re.finditer(rf'{name_pat}[\s,\-\|]+{trigger}', text):
        name = match.group(1).strip()
        words = name.lower().split()
        if not any(w in word_blacklist for w in words) and company_name.lower() not in name.lower():
            return name

    # Pattern 2: "CEO Name" / "fondateur: Name"
    for match in re.finditer(rf'{trigger}[\s:,\-\|]+{name_pat}', text, re.IGNORECASE):
        name = match.group(1).strip()
        words = name.lower().split()
        if not any(w in word_blacklist for w in words) and company_name.lower() not in name.lower():
            return name

    # Pattern 3: LinkedIn-style "Firstname Lastname - Company | LinkedIn"
    linkedin_pat = rf'{name_pat}\s*[\-\|]\s*{re.escape(company_name)}'
    for match in re.finditer(linkedin_pat, text, re.IGNORECASE):
        name = match.group(1).strip()
        words = name.lower().split()
        if not any(w in word_blacklist for w in words):
            return name

    return None


# ============================================================
# 2. PAPPERS API - Trouver le CEO
# ============================================================
def find_ceo_from_pappers(company_name: str) -> Optional[Dict]:
    """
    Cherche une entreprise par son nom sur Pappers et renvoie le dirigeant principal.
    Utilise 2 etapes:
      1. Recherche par nom -> SIREN + nom legal
      2. Tente /v2/entreprise pour les dirigeants (plan payant)
      3. Fallback sur les dirigeants du search result (plan gratuit)
    """
    if not PAPPERS_API_TOKEN or PAPPERS_API_TOKEN == "REMPLACE_PAR_TON_TOKEN_PAPPERS":
        print("[!] PAPPERS_API_TOKEN non configure dans .env")
        return None

    try:
        # --- ETAPE 1 : Trouver l'entreprise par nom ---
        print(f"[PAPPERS] Recherche pour : {company_name}...")
        search_url = "https://api.pappers.fr/v2/recherche"
        search_params = {
            "api_token": PAPPERS_API_TOKEN,
            "q": company_name,
            "precision": "standard",
            "par_page": 1,
            "entreprise_cessee": "false"
        }
        response = requests.get(search_url, params=search_params, timeout=10)

        if response.status_code == 429:
            print("[!] Quota Pappers depasse !")
            return None
        if response.status_code != 200:
            print(f"[X] Erreur API Pappers : {response.status_code}")
            return None

        data = response.json()
        resultats = data.get("resultats", [])

        if not resultats:
            print("[X] Aucune entreprise trouvee sur Pappers.")
            return None

        entreprise = resultats[0]
        siren = entreprise.get("siren")
        nom_entreprise = entreprise.get("nom_entreprise", company_name)
        print(f"[OK] Entreprise trouvee : {nom_entreprise} (SIREN: {siren})")

        # --- ETAPE 2 : Essayer /v2/entreprise (plan payant) ---
        dirigeants = []
        try:
            print(f"[PAPPERS] Fetch fiche entreprise SIREN {siren}...")
            fiche_url = "https://api.pappers.fr/v2/entreprise"
            fiche_params = {
                "api_token": PAPPERS_API_TOKEN,
                "siren": siren,
            }
            fiche_resp = requests.get(fiche_url, params=fiche_params, timeout=10)

            if fiche_resp.status_code == 200:
                fiche_data = fiche_resp.json()
                dirigeants = fiche_data.get("representants", [])
                if dirigeants:
                    print(f"[OK] {len(dirigeants)} representants trouves (plan payant)")
            elif fiche_resp.status_code == 401:
                print("[!] /v2/entreprise non dispo (plan gratuit), fallback search results")
            else:
                print(f"[!] Fiche entreprise erreur {fiche_resp.status_code}, fallback")
        except Exception:
            pass

        # --- ETAPE 3 : Fallback sur les dirigeants du search result ---
        if not dirigeants:
            dirigeants = entreprise.get("dirigeants", [])
            if dirigeants:
                print(f"[OK] {len(dirigeants)} dirigeants trouves via recherche")

        # --- ETAPE 4 : Fallback beneficiaires effectifs ---
        if not dirigeants:
            beneficiaires = entreprise.get("beneficiaires", [])
            if beneficiaires:
                print(f"[OK] {len(beneficiaires)} beneficiaires trouves (fallback)")
                dirigeants = beneficiaires

        if not dirigeants:
            print("[X] Aucun dirigeant trouve (API limitee).")
            return {
                "prenom": None,
                "nom": None,
                "qualite": None,
                "full_name": None,
                "nom_entreprise": nom_entreprise,
                "siren": siren,
                "site_web": None,
                "ceo_found": False
            }

        # Chercher le "Grand Patron"
        cible = _find_best_leader(dirigeants)

        if not cible:
            print("[X] Aucun dirigeant physique exploitable.")
            return {
                "prenom": None,
                "nom": None,
                "qualite": None,
                "full_name": None,
                "nom_entreprise": nom_entreprise,
                "siren": siren,
                "site_web": None,
                "ceo_found": False
            }

        prenom = (cible.get("prenom") or cible.get("prenom_usuel") or "").strip()
        nom = (cible.get("nom") or "").strip()
        qualite = cible.get("qualite", "Inconnu")
        full_name = f"{prenom} {nom}"
        print(f"[OK] Dirigeant trouve : {full_name} ({qualite})")
        return {
            "prenom": prenom,
            "nom": nom,
            "qualite": qualite,
            "full_name": full_name,
            "nom_entreprise": nom_entreprise,
            "siren": siren,
            "site_web": entreprise.get("site_web", ""),
            "ceo_found": True
        }

    except Exception as e:
        print(f"[X] Erreur technique Pappers : {e}")
        return None


def _find_best_leader(dirigeants: list) -> Optional[Dict]:
    """Finds the best leader from a list of dirigeants."""
    titres = ["president", "gerant", "directeur general", "ceo", "fondateur"]

    # Priority: titled physical person
    for d in dirigeants:
        if d.get("personne_morale"):
            continue
        qualite = (d.get("qualite", "") or "").lower()
        qualite_norm = unicodedata.normalize('NFKD', qualite).encode('ascii', 'ignore').decode('ascii')
        if any(t in qualite_norm for t in titres):
            return d

    # Fallback: any physical person
    for d in dirigeants:
        if not d.get("personne_morale"):
            return d

    return None


# ============================================================
# 3. EMAIL PERMUTATION
# ============================================================
def _normalize(name: str) -> str:
    """Normalize accents and lowercase."""
    n = name.lower().strip()
    return unicodedata.normalize('NFKD', n).encode('ascii', 'ignore').decode('ascii')


def generate_permutations(first: str, last: str, domain: str) -> List[str]:
    """Genere les formats d'email les plus courants."""
    f = _normalize(first)
    l = _normalize(last)

    if not f or not l:
        return []

    perms = [
        f"{f}.{l}@{domain}",       # prenom.nom@
        f"{f}{l}@{domain}",        # prenomnom@
        f"{f}@{domain}",           # prenom@
        f"{f[0]}{l}@{domain}",     # pnom@
        f"{f[0]}.{l}@{domain}",    # p.nom@
        f"{l}.{f}@{domain}",       # nom.prenom@
        f"{l}@{domain}",           # nom@
        f"{f}-{l}@{domain}",       # prenom-nom@
    ]

    return list(dict.fromkeys(perms))


# ============================================================
# 4. SMTP VERIFICATION
# ============================================================
def get_mx_record(domain: str) -> Optional[str]:
    """Resout le serveur MX pour un domaine."""
    try:
        records = dns.resolver.resolve(domain, 'MX')
        return str(records[0].exchange)
    except Exception:
        return None


def verify_email_smtp(email: str, mx_host: str) -> str:
    """
    Verifie l'existence d'un email via SMTP RCPT TO.
    Retourne : 'VALID', 'INVALID', 'UNKNOWN'
    """
    try:
        server = smtplib.SMTP(timeout=5)
        server.set_debuglevel(0)
        server.connect(mx_host)
        server.helo('scope-app.com')
        server.mail('verify@scope-app.com')
        code, _ = server.rcpt(email)
        server.quit()

        if code == 250:
            return 'VALID'
        elif code == 550:
            return 'INVALID'
        return 'UNKNOWN'
    except Exception:
        return 'UNKNOWN'


def is_catch_all(domain: str, mx_host: str) -> bool:
    """Verifie si le domaine accepte tous les emails (catch-all)."""
    fake = f"zzzfaketest12345@{domain}"
    return verify_email_smtp(fake, mx_host) == 'VALID'


# ============================================================
# 5. PIPELINE PRINCIPAL
# ============================================================
def find_contact(
    company_name: str,
    domain_override: str = None,
    first_name: str = None,
    last_name: str = None,
) -> Optional[Dict]:
    """
    Pipeline complet :
    1. DDG -> Domaine commercial
    2. Pappers -> CEO / President
    3. Email permutation + SMTP verification
    
    Accepts manual overrides for domain, first_name, last_name.
    """
    print(f"\n{'='*50}")
    print(f">>> CONTACT FINDER : {company_name}")
    print(f"{'='*50}\n")

    # --- ETAPE 1 : Trouver le domaine commercial (DDG) ---
    domain = domain_override
    if not domain:
        domain = get_company_domain(company_name)
    if not domain:
        print("[X] Domaine introuvable. Utilise --domain pour le specifier.")
        return None

    # --- ETAPE 2 : Trouver le CEO (Pappers) ---
    ceo = None
    if first_name and last_name:
        # Manual override
        print(f"[OK] Nom fourni manuellement : {first_name} {last_name}")
        ceo = {
            "prenom": first_name,
            "nom": last_name,
            "qualite": "Manuel",
            "full_name": f"{first_name} {last_name}",
            "nom_entreprise": company_name,
            "siren": None,
            "site_web": None,
            "ceo_found": True
        }
    else:
        ceo = find_ceo_from_pappers(company_name)

        # Fallback DDG si Pappers n'a pas de CEO
        if ceo and not ceo.get("ceo_found"):
            print("\n[FALLBACK] Pappers n'a pas de dirigeant, on essaie DDG...")
            ddg_ceo = find_ceo_from_ddg(company_name)
            if ddg_ceo:
                # Keep SIREN/nom_entreprise from Pappers, name from DDG
                ddg_ceo["siren"] = ceo.get("siren")
                ddg_ceo["nom_entreprise"] = ceo.get("nom_entreprise")
                ceo = ddg_ceo
        elif not ceo:
            # Pappers failed entirely, try DDG alone
            print("\n[FALLBACK] Pappers a echoue, on essaie DDG...")
            ceo = find_ceo_from_ddg(company_name)

    if not ceo:
        print("[X] CEO introuvable (ni Pappers, ni DDG).")
        return {"domain": domain, "email": None, "email_status": "CEO_NOT_FOUND"}

    prenom = ceo.get("prenom")
    nom = ceo.get("nom")

    if not prenom or not nom:
        print(f"[!] CEO sans nom exploitable. Entreprise legale: {ceo.get('nom_entreprise')}")
        print("[TIP] Relance avec: --first PRENOM --last NOM")
        return {
            **ceo,
            "domain": domain,
            "email": None,
            "email_status": "CEO_NAME_MISSING"
        }

    # --- ETAPE 3 : Generer les emails ---
    print(f"\n[MAIL] Generation d'emails pour {prenom} {nom} @ {domain}...")
    permutations = generate_permutations(prenom, nom, domain)

    if not permutations:
        return {**ceo, "domain": domain, "email": None, "email_status": "NO_PERMUTATIONS"}

    # --- ETAPE 4 : Verification SMTP ---
    mx_host = get_mx_record(domain)
    if not mx_host:
        best_guess = permutations[0]
        print(f"[!] Pas de MX pour {domain}. Best guess : {best_guess}")
        return {
            **ceo,
            "domain": domain,
            "email": best_guess,
            "email_candidates": permutations[:3],
            "email_status": "GUESS_ONLY"
        }

    # Check catch-all
    print("[CHECK] Verification catch-all...")
    if is_catch_all(domain, mx_host):
        best_guess = permutations[0]
        print(f"[!] Catch-all detecte. Best guess : {best_guess}")
        return {
            **ceo,
            "domain": domain,
            "email": best_guess,
            "email_candidates": permutations[:3],
            "email_status": "CATCH_ALL"
        }

    # Test each permutation
    print("[SMTP] Test des permutations...")
    for email in permutations:
        sys.stdout.write(f"   >> {email} ... ")
        sys.stdout.flush()
        status = verify_email_smtp(email, mx_host)
        print(status)

        if status == 'VALID':
            print(f"\n[+++] EMAIL VERIFIE : {email}")
            return {
                **ceo,
                "domain": domain,
                "email": email,
                "email_status": "VERIFIED"
            }

    # None verified -> return best guess
    best_guess = permutations[0]
    print(f"\n[!] Aucun email verifie. Best guess : {best_guess}")
    return {
        **ceo,
        "domain": domain,
        "email": best_guess,
        "email_candidates": permutations[:3],
        "email_status": "UNVERIFIED"
    }


# ============================================================
# 6. CLI
# ============================================================
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Contact Finder - Trouve CEO + Email")
    parser.add_argument("company", help="Nom de l'entreprise (ex: OVRSEA)")
    parser.add_argument("--domain", help="Domaine manuel (ex: ovrsea.com)", default=None)
    parser.add_argument("--first", help="Prenom du CEO (override)", default=None)
    parser.add_argument("--last", help="Nom du CEO (override)", default=None)
    args = parser.parse_args()

    result = find_contact(
        args.company,
        domain_override=args.domain,
        first_name=args.first,
        last_name=args.last
    )

    if result:
        print(f"\n{'='*50}")
        print(f"<<< RESULTAT FINAL >>>")
        print(f"{'='*50}")
        print(f"   Entreprise : {result.get('nom_entreprise', result.get('company', 'N/A'))}")
        print(f"   Dirigeant  : {result.get('full_name', 'N/A')} ({result.get('qualite', 'N/A')})")
        print(f"   Domaine    : {result.get('domain', 'N/A')}")
        print(f"   Email      : {result.get('email', 'N/A')}")
        print(f"   Statut     : {result.get('email_status', 'N/A')}")
        if result.get('email_candidates'):
            print(f"   Candidats  : {', '.join(result['email_candidates'])}")
        print(f"   SIREN      : {result.get('siren', 'N/A')}")
    else:
        print("\n[X] Aucun resultat.")
