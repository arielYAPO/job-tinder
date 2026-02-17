# ============================================================
# 0. IMPORTS & CONFIGURATION
# ============================================================
import os
import sys
import io
import json
import re
import asyncio
from typing import Dict, List, Optional, Literal

# Force UTF-8 logs on Windows consoles
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from supabase import create_client, Client
import google.generativeai as genai
from browser_use import Agent, ChatGoogle, Controller
from job_service import JobService
from find_contact import find_contact

# ============================================================
# ENV LOADING
# ============================================================
# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(script_dir)  # Parent directory (jobtinder root)

# Load environment variables
load_dotenv(os.path.join(script_dir, ".env"))       # browser-use/.env
load_dotenv(os.path.join(root_dir, ".env.local"))   # root .env.local (Next.js style)

# API Keys
api_key = os.getenv("GOOGLE_API_KEY")
if not api_key:
    print("Warning: GOOGLE_API_KEY not found in .env")

# Supabase Client
supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in .env")

# Public client (RLS applied)
supabase: Client = create_client(supabase_url, supabase_key)

# Admin client (Bypass RLS) - Use ONLY for background tasks
supabase_admin: Optional[Client] = None
if supabase_service_key:
    supabase_admin = create_client(supabase_url, supabase_service_key)
    print("✅ Supabase Admin Client initialized (Service Role)")
else:
    print("⚠️ Supabase Admin Client NOT initialized (Missing SERVICE_ROLE_KEY)")

# Configure Gemini API for enrichment
if api_key:
    genai.configure(api_key=api_key)

# Initialize JobService for company analysis and skill extraction
job_service = JobService(api_key=api_key) if api_key else None

# ============================================================
# FASTAPI APP SETUP
# ============================================================
app = FastAPI(
    title="JobTinder API",
    description="API pour le matching et le scraping de jobs",
    version="2.0.0",
)

# CORS - Permet au frontend Next.js d'appeler l'API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health Check
@app.get("/")
async def root():
    return {"status": "healthy", "service": "JobTinder API", "version": "2.0.0"}
# ============================================================
# 1. MATCHING CONSTANTS (Le Dictionnaire du Recruteur)
# ============================================================
# On définit ici les règles du jeu pour le matching.

# Poids des critères pour le score final (Total = 100)
MATCH_WEIGHTS = {
    "skill_overlap": 65,  # Les compétences techniques comptent le plus
    "objective_fit": 30,  # Est-ce que c'est le bon poste visé ?
    "hiring_signal": 5,   # Bonus si mots clés "junior", "alternance"...
}

# Synonymes pour normaliser les compétences (Ex: "js" devient "javascript")
# Ça évite de rater un match juste à cause d'une abréviation.
SKILL_SYNONYMS: Dict[str, str] = {
    "js": "javascript",
    "node": "nodejs",
    "node.js": "nodejs",
    "react.js": "react",
    "next": "nextjs",
    "next.js": "nextjs",
    "py": "python",
    "postgres": "postgresql",
}

# Si le job mentionne "Frontend", on suppose qu'il faut ces skills :
ROLE_TO_SKILLS: Dict[str, List[str]] = {
    "frontend": ["react", "javascript", "typescript", "html", "css"],
    "backend": ["nodejs", "python", "fastapi", "django", "express", "sql"],
    "data science": ["python", "sql", "machine learning"],
    "ml": ["python", "machine learning", "ml", "ai"],  # Ajouté pour ML/AI
}

# Mots-clés pour deviner le rôle si ce n'est pas explicite
ROLE_KEYWORDS: Dict[str, List[str]] = {
    "frontend": ["frontend", "react", "vue", "angular", "nextjs", "javascript", "typescript"],
    "backend": ["backend", "api", "fastapi", "django", "nodejs", "express", "python", "java", "spring"],
    "fullstack": ["full stack", "fullstack", "frontend", "backend"],
    "data": ["data", "data engineer", "data analyst", "sql", "etl", "warehouse"],
    "ml_ai": ["ml", "machine learning", "ai", "ia", "intelligence artificielle", "deep learning", "nlp", "genai", "gen ai", "llm", "rag", "gpt"],
    "devops": ["devops", "sre", "docker", "kubernetes", "ci/cd", "cloud", "aws", "gcp", "azure"],
    "security": ["security", "cyber", "pentest", "soc", "siem"],
}

# Rôles explicites (quand l'utilisateur sélectionne "Je veux des jobs AI")
# Plus strict que ROLE_KEYWORDS - utilisé pour le filtre d'intention
PREFERENCE_ROLES: Dict[str, List[str]] = {
    "ai_engineer": ["ai", "ia", "intelligence artificielle", "genai", "llm", "rag", "embedding", "fine-tuning", "nlp"],
    "ml_engineer": ["machine learning", "ml", "deep learning", "model", "training", "inference", "pipeline"],
    "backend": ["backend", "api", "fastapi", "django", "express", "microservices"],
    "frontend": ["frontend", "react", "nextjs", "vue", "angular", "typescript"],
    "data_engineer": ["data engineer", "etl", "pipeline", "warehouse", "spark", "airflow", "dbt"],
}

# ============================================================
# 2. PYDANTIC MODELS (Le Contrat d'Interface)
# ============================================================
# C'est ici qu'on définit la forme EXACTE des données.
# Pydantic va rejeter tout ce qui ne correspond pas (Validation automatique).



# Ce que le Frontend nous envoie pour définir l'utilisateur
class UserProfile(BaseModel):
    skills: List[str] = Field(default_factory=list) # Ex: ["Python", "React"]
    objectif: str = ""  # Ex: "Je cherche une alternance Backend"

# Les préférences de recherche (Filtres)
class SearchPreferences(BaseModel):
    target_roles: List[str] = Field(default_factory=list)  # Ex: ["backend", "ai_engineer"]
    exclude_keywords: List[str] = Field(default_factory=list)  # Mots à éviter
    must_have_keywords: List[str] = Field(default_factory=list)  # Mots obligatoires
    contract_types: List[str] = Field(default_factory=list)  # Ex: ["alternance", "CDI"]
    strict_intent: bool = False  # Si True, exclut les jobs sans match d'intention
    enriched_only: bool = False  # Si True, exclut les jobs sans description
    min_score: int = 0 

# La requête complète envoyée par le site web au serveur
class MatchRequest(BaseModel):
    user_profile: UserProfile
    preferences: Optional[SearchPreferences] = None

# La réponse que le serveur renvoie au site web
class MatchResponse(BaseModel):
    success: bool
    total_jobs: int
    matched: int
    filtered: int = 0  # Combien de jobs ont été exclus par les filtres (debug)
    message: str = ""  # Message de statut
    matches: List[dict] = Field(default_factory=list)  # La liste des jobs triés

# Pour le scraping
class ScrapeResponse(BaseModel):
    success: bool
    count: int
    message: str


# ============================================================
# HELPERS
# ============================================================

def fetch_all_jobs(sb_client, batch_size=1000, require_desc=False):
    """Fetch ALL jobs from Supabase using pagination to bypass 1000-row limit."""
    all_jobs = []
    offset = 0
    while True:
        q = sb_client.table("jobs").select("*")
        if require_desc:
            q = q.not_.is_("job_description", "null")

        r = q.range(offset, offset + batch_size - 1).execute()
        batch = r.data or []
        all_jobs.extend(batch)
        if len(batch) < batch_size:
            break
        offset += batch_size
    return all_jobs

def normalize_skill(skill: str) -> str:
    """Normalize a skill string for consistent matching."""
    if not skill or not skill.strip():
        return ""
    normalized = skill.lower().strip()
    return SKILL_SYNONYMS.get(normalized, normalized)


def as_list(x):
    """Safely convert stack to list (handles string, list, None)."""
    if x is None:
        return []
    if isinstance(x, list):
        return x
    if isinstance(x, str):
        s = x.strip()
        # try json list
        if s.startswith("[") and s.endswith("]"):
            try:
                return json.loads(s)
            except:
                pass
        # fallback comma split
        return [p.strip() for p in s.split(",") if p.strip()]
    return []


def contains_kw(text: str, kw: str) -> bool:
    """
    Check if keyword exists in text.
    - Multi-word phrases: substring match (e.g., "machine learning" in text)
    - Single words: word-boundary regex to avoid false positives
      (e.g., "intern" should NOT match "internal")
    """
    kw = kw.lower().strip()
    if not kw:
        return False
    if " " in kw:
        return kw in text
    return re.search(rf"\b{re.escape(kw)}\b", text) is not None


def infer_user_roles(objective: str) -> set:
    """Infer role buckets from user objective text."""
    if not objective:
        return set()
    txt = objective.lower()
    matched_roles = set()
    for role, keywords in ROLE_KEYWORDS.items():
        if any(contains_kw(txt, kw) for kw in keywords):
            matched_roles.add(role)
    return matched_roles

# ============================================================
# 4. JOB MATCH ALGORITHM (Version Finale MVP)
# ============================================================

def compute_job_match_score(user_profile, job_data: dict, preferences: Optional[SearchPreferences] = None) -> Optional[dict]:
    """
    Calcule un score (0-100) pour un job.
    Gère les Bonus (Alternance) et Malus (Senior).
    """
    
    # --- 1. PRÉPARATION ---
    job_title = job_data.get("title") or ""
    job_desc = job_data.get("job_description") or ""
    stack = as_list(job_data.get("stack"))
    skills_extracted = as_list(job_data.get("skills_extracted"))
    contract_type = job_data.get("contract_type") or ""
    
    # Le Blob pour tout scanner d'un coup
    job_full_text = f"{job_title} {job_desc} {job_data.get('sector', '')} {' '.join(stack)} {' '.join(skills_extracted)}".lower()
    contract_blob = f"{contract_type} {job_title}".lower()

    # --- 2. FILTRES "KILL SWITCH" ---
    
    # A. Mots Exclus (Strict : Si je déteste, je jette)
    if preferences:
        for kw in preferences.exclude_keywords:
            if contains_kw(job_full_text, kw.lower()):
                return None 

        # B. Must Have (Strict)
        if preferences.must_have_keywords:
            if not any(contains_kw(job_full_text, kw.lower()) for kw in preferences.must_have_keywords):
                return None

    # C. Filtre Contrat "Soft" (On ne jette plus, on note juste si c'est le bon)
    is_target_contract = True
    if preferences and preferences.contract_types:
        if not any(contains_kw(contract_blob, ct.lower()) for ct in preferences.contract_types):
            is_target_contract = False # Ce n'est pas le contrat idéal, on appliquera une pénalité plus tard

    # D. Enriched Only (Jobs sans description = moins pertinents)
    has_description = bool(job_desc.strip())
    if preferences and preferences.enriched_only and not has_description:
        return None  # Mode strict: on exclut les jobs sans description

    # --- 3. CALCUL DES POINTS ---

    # A. INTENT FIT (Max 60 pts)
    intent_score = 0
    matched_intent_keywords = []
    
    # BONUS: Direct title match with user objective (e.g., "GenAI Engineer" in both)
    user_obj_lower = user_profile.objectif.lower()
    job_title_lower = job_title.lower()
    
    # Extract key terms from user objective (2+ char words)
    obj_terms = [w for w in re.split(r'\W+', user_obj_lower) if len(w) >= 2]
    title_match_bonus = 0
    for term in obj_terms:
        if term in job_title_lower:
            title_match_bonus += 15
            if term not in matched_intent_keywords:
                matched_intent_keywords.append(term)
    title_match_bonus = min(40, title_match_bonus)  # Cap at 40 pts
    
    # On utilise ton objectif pour deviner les roles
    user_roles = infer_user_roles(user_profile.objectif)
    
    # Si on a coché des rôles explicites dans les préférences, on utilise PREFERENCE_ROLES (plus strict)
    if preferences and preferences.target_roles:
        for role in preferences.target_roles:
            # PREFERENCE_ROLES a des keywords plus spécifiques (llm, rag, embedding...)
            keywords = PREFERENCE_ROLES.get(role, ROLE_KEYWORDS.get(role, []))
            role_hits = 0
            for kw in keywords:
                if contains_kw(job_full_text, kw):
                    role_hits += 10
                    if kw not in matched_intent_keywords:
                        matched_intent_keywords.append(kw)
            intent_score += min(30, role_hits)
    else:
        # Fallback: on utilise ROLE_KEYWORDS (plus général)
        for role in user_roles:
            keywords = ROLE_KEYWORDS.get(role, [])
            role_hits = 0
            for kw in keywords:
                if contains_kw(job_full_text, kw):
                    role_hits += 10
                    if kw not in matched_intent_keywords:
                        matched_intent_keywords.append(kw)
            intent_score += min(30, role_hits)
    
    intent_score = min(60, intent_score)
    
    # STRICT INTENT: Si activé et aucun match d'intention, on jette
    if preferences and preferences.strict_intent and intent_score == 0:
        return None


    # B. SKILL FIT (Max 30 pts)
    user_skills_clean = {normalize_skill(s) for s in user_profile.skills}
    
    # Expansion des tags (Frontend -> React, JS...)
    all_job_skills = set(stack) | set(skills_extracted)
    for tag in stack:
        if tag and tag.lower() in ROLE_TO_SKILLS:
            all_job_skills.update(ROLE_TO_SKILLS[tag.lower()])
            
    job_skills_clean = {normalize_skill(s) for s in all_job_skills if s}
    
    # Intersection
    matched_skills = user_skills_clean & job_skills_clean
    overlap_count = len(matched_skills)
    
    skill_score = 0
    if overlap_count > 0:
        skill_score = min(30, 10 + overlap_count * 5)


    # C. HIRING SIGNAL & SENIOR PENALTY (Max 10 pts... ou Malus)
    hiring_score = 5 # Base
    
    target_terms = ["alternance", "apprentissage", "contrat pro", "internship"] # Le Graal
    junior_terms = ["junior", "stage", "intern", "entry level", "débutant"]      # Bien
    senior_terms = ["senior", "lead", "principal", "staff", "manager", "head of", "director", "5+ years", "10 ans", "expert"] # Attention

    is_senior = False
    
    # 1. Check Seniority (Le Piège)
    if any(contains_kw(contract_blob, t) for t in senior_terms):
        is_senior = True
        hiring_score = 0 # On enlève les points "Hiring"
    
    # 2. Check Bonus (Le Graal)
    elif any(contains_kw(contract_blob, t) for t in target_terms):
        hiring_score = 20 # Super Bonus (dépasse le max théorique de 10, c'est fait exprès pour booster)

    # 3. Check Junior
    elif any(contains_kw(contract_blob, t) for t in junior_terms):
        hiring_score = 10


    # --- 4. SCORE FINAL & PENALTIES ---
    total_score = intent_score + skill_score + hiring_score + title_match_bonus
    
    # Pénalité 1 : Ce n'est pas le contrat demandé (ex: CDI au lieu d'Alternance)
    if not is_target_contract:
        total_score = total_score * 0.7  # On garde 70% du score

    # Pénalité 2 : C'est un poste Senior (ex: Lead Dev)
    if is_senior:
        total_score = total_score * 0.5  # Grosse pénalité

    # Pénalité 3 : Pas de description (on sait moins si ça match vraiment)
    if not has_description:
        total_score = total_score * 0.8  # Légère pénalité

    # On s'assure que ça reste propre entre 0 et 100
    total_score = min(100, int(total_score))

    # Filtre Final (Min Score)
    if preferences and total_score < preferences.min_score:
        return None

    # --- 5. RESULTAT ---
    
    # Confiance du match (pour l'affichage UI)
    confidence = "low"
    if total_score >= 80: confidence = "very high"
    elif total_score >= 60: confidence = "high"
    elif total_score >= 40: confidence = "medium"

    return {
        "job_id": job_data.get("external_id"),
        "title": job_title,
        "company": job_data.get("company_name"),
        "company_slug": job_data.get("company_slug"),      # NEW: For URL building
        "logo_url": job_data.get("logo_url"),              # NEW: Company logo from Algolia
        "location": job_data.get("location"),              # NEW: City, Country
        "published_at": job_data.get("published_at"),      # NEW: Publication date
        "contract_type": contract_type,
        "score": total_score,
        "details": {
            "intent": intent_score, 
            "skill": skill_score, 
            "hiring_score": hiring_score,
            "penalties": {
                "senior_penalty": is_senior,
                "wrong_contract": not is_target_contract,
                "no_description": not has_description
            }
        },
        "matched_skills": list(matched_skills),
        "matched_intent": matched_intent_keywords[:5],
        "url": job_data.get("apply_url"),
        "match_confidence": confidence,
        # AI enrichment fields
        "suggested_outreach_roles": job_data.get("suggested_outreach_roles", []),
        "enrichment_json": job_data.get("enrichment_json", {})
    }


# ============================================================
# MATCH ENDPOINT
# ============================================================

@app.post("/match", response_model=MatchResponse)
async def match_jobs(req: MatchRequest):
    try:
        user_profile = req.user_profile
        prefs = req.preferences or SearchPreferences()

        # Fetch all jobs using pagination helper
        jobs = fetch_all_jobs(supabase)

        total = len(jobs)
        matches = []
        filtered = 0

        for j in jobs:
            r = compute_job_match_score(user_profile, j, prefs)
            if r is None:
                filtered += 1
                continue
            matches.append(r)

        matches.sort(key=lambda x: x["score"], reverse=True)

        return MatchResponse(
            success=True,
            total_jobs=total,
            matched=len(matches),
            filtered=filtered,
            message="Matching computed successfully.",
            matches=matches[:200],  # keep UI manageable
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# MATCH BY COMPANY ENDPOINT (Groups jobs per company)
# ============================================================

class CompanyMatchResponse(BaseModel):
    success: bool
    total_companies: int
    total_jobs: int
    companies: List[dict] = Field(default_factory=list)

@app.post("/match-by-company", response_model=CompanyMatchResponse)
async def match_jobs_by_company(req: MatchRequest):
    """
    Same as /match, but groups results by company.
    Returns a structure that matches the frontend design:
    - Each company has: name, logo_url, location, score (avg), jobs[]
    """
    try:
        user_profile = req.user_profile
        prefs = req.preferences or SearchPreferences()

        # Fetch all jobs using pagination helper
        jobs = fetch_all_jobs(supabase)

        # Compute match scores
        matches = []
        for j in jobs:
            r = compute_job_match_score(user_profile, j, prefs)
            if r is not None:
                matches.append(r)


        # Group by company
        companies_dict = {}
        for match in matches:
            company_name = match.get("company") or "Unknown"
            
            if company_name not in companies_dict:
                companies_dict[company_name] = {
                    "name": company_name,
                    "slug": match.get("company_slug", ""),
                    "logo_url": match.get("logo_url"),
                    "location": match.get("location", ""),
                    "jobs": [],
                    "total_score": 0,
                    "job_count": 0,
                    "suggested_roles": match.get("suggested_outreach_roles", []),
                    "enrichment_json": match.get("enrichment_json", {})
                }
            
            # Add job to company
            companies_dict[company_name]["jobs"].append({
                "id": match.get("job_id"),
                "title": match.get("title"),
                "type": match.get("contract_type"),
                "score": match.get("score"),
                "tag": "Offre Officielle",  # Default tag
                "url": match.get("url"),
                "matched_skills": match.get("matched_skills", []),
                "match_confidence": match.get("match_confidence")
            })
            companies_dict[company_name]["total_score"] += match.get("score", 0)
            companies_dict[company_name]["job_count"] += 1

        # Build final list with MAX scores (best job dictates company relevance)
        companies_list = []
        for company_data in companies_dict.values():
            # Use MAX score instead of AVERAGE to highlight companies with at least one great fit
            # If a company has 1 perfect job and 10 irrelevant ones, it IS a perfect match for that job.
            avg_score = max((j["score"] for j in company_data["jobs"]), default=0)
            
            if "OVRSEA" in company_data["name"]:
                print(f"DEBUG_COMPANY: {company_data['name']} has MAX SCORE: {avg_score}")

            # Generate logo initials if no logo_url
            logo = company_data["logo_url"]
            if not logo:
                logo = company_data["name"][:2].upper() if company_data["name"] else "??"
            
            # Get AI suggestions if available
            enrichment = company_data.get("enrichment_json") or {}
            suggestions = enrichment.get("suggestions", []) if isinstance(enrichment, dict) else []
            ai_match_reason = None
            if suggestions:
                # Use first suggestion's rationale as matchReason
                ai_match_reason = suggestions[0].get("rationale", "")
            
            companies_list.append({
                "id": hash(company_data["name"]) % 10000,  # Generate stable ID
                "name": company_data["name"],
                "slug": company_data["slug"],
                "logo": logo,
                "logo_url": company_data["logo_url"],
                "location": company_data["location"],
                "score": avg_score,
                "matchReason": ai_match_reason or f"Match basé sur {company_data['job_count']} opportunité(s) détectée(s).",
                "jobs": sorted(company_data["jobs"], key=lambda x: x["score"], reverse=True),
                "suggested_roles": company_data.get("suggested_roles", []),
                "ai_suggestions": suggestions  # Full AI suggestions with title, rationale, confidence
            })

        # Sort companies by score (highest first)
        companies_list.sort(key=lambda x: x["score"], reverse=True)

        return CompanyMatchResponse(
            success=True,
            total_companies=len(companies_list),
            total_jobs=len(matches),
            companies=companies_list[:10]  # Limit to top 10 companies
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# SCRAPE STATIONF (the big one you pasted)
# ============================================================

@app.get("/scrape/stationf", response_model=ScrapeResponse)
async def scrape_stationf():
    """
    Scrape ALL job listings from Station F -> DB.
    Handles pagination and incremental saving.
    """
    try:
        llm = ChatGoogle(model="gemini-2.5-flash", api_key=api_key)
        controller = Controller()

        # Define Pydantic models for the tool
        class JobItem(BaseModel):
            title: str
            company: str
            contract: str
            url: str

        class JobsBatch(BaseModel):
            jobs: List[JobItem]

        # Define tool for incremental saving
        @controller.action("save_jobs_batch", param_model=JobsBatch)
        async def save_jobs_batch(params: JobsBatch):
            """
            Saves a batch of jobs to Supabase immediately.
            Useful to save progress page by page.
            """
            try:
                jobs_list = params.jobs
                print(f"DEBUG: Received batch of {len(jobs_list)} jobs")
                print(f"⚡ Saving batch of {len(jobs_list)} jobs...")

                count = 0
                for j in jobs_list:
                    url = j.url
                    if not url:
                        continue
                    if url.startswith("/"):
                        url = f"https://jobs.stationf.co{url}"

                    record = {
                        "external_id": url,
                        "title": j.title,
                        "company_name": j.company,
                        "contract_type": j.contract,
                        "apply_url": url,
                        "source": "stationf",
                        "location": "Paris (Station F)",
                    }
                    supabase.table("jobs").upsert(record, on_conflict="external_id").execute()
                    count += 1

                return f"Saved {count} jobs to DB."
            except Exception as e:
                import traceback
                traceback.print_exc()
                print(f"Save Error Details: {e}")
                return f"Error saving batch: {str(e)}"

        task = """
        Go to https://jobs.stationf.co/search

        This site uses NUMBERED PAGINATION (1, 2, 3 ... >).

        INSTRUCTIONS:
        1. LOOP through pages:
           a. Scrape job cards (class 'jobs-item-link').
           b. **CRITICAL**: Call `save_jobs_batch` with `jobs=[{title, company, contract, url}, ...]`.
              - The tool expects an object with a "jobs" key.
              - Do NOT write to file.
           c. Scroll to bottom.
           d. Click NEXT button (`ais-Pagination-item--nextPage`).
           e. Wait for load.

        2. STOP when Next button gone.
        """

        agent = Agent(llm=llm, task=task, controller=controller, flash_mode=False)
        history = await agent.run()
        _ = history.final_result()

        print("Scraping phase complete. Starting enrichment phase...")

        response = supabase.table("jobs").select("*").eq("source", "stationf").execute()
        db_jobs = response.data or []

        if not db_jobs:
            return ScrapeResponse(success=True, count=0, message="Agent finished but no jobs found in DB.")

        jobs_by_company: Dict[str, List[dict]] = {}
        for job in db_jobs:
            company = job.get("company_name") or "Unknown"
            jobs_by_company.setdefault(company, []).append(job)

        print(f"Found {len(jobs_by_company)} companies to valid/enrich.")

        enriched_count = 0
        jobs_scraped = 0

        for company, jobs in jobs_by_company.items():
            company_already_enriched = bool(jobs[0].get("sector"))

            if not company_already_enriched:
                print(f"Processing company: {company}")

                titles = [j.get("title") for j in jobs]
                try:
                    description = await job_service.scrape_description(company)
                except Exception as e:
                    print(f"Desc scrape failed for {company}: {e}")
                    description = ""

                try:
                    analysis = await job_service.analyze_company(company, description, titles)
                    sector = analysis.sector
                    stack = analysis.stack
                    pitch = analysis.pitch
                except Exception as e:
                    print(f"Analysis failed for {company}: {e}")
                    sector = "Unknown"
                    stack = []
                    pitch = ""
            else:
                print(f"Company {company} already enriched, checking job-level data...")
                sector = jobs[0].get("sector")
                stack = jobs[0].get("stack") or []
                pitch = jobs[0].get("pitch") or ""
                description = jobs[0].get("description") or ""

            for job in jobs:
                try:
                    if job.get("job_description"):
                        print(f"  Skipping job {job['title'][:30]}... (already scraped)")
                        continue

                    job_url = job.get("apply_url") or job.get("external_id")
                    print(f"  Scraping job: {job['title'][:40]}...")

                    job_description = await job_service.scrape_job_page(job_url)

                    text_to_analyze = f"{job.get('title', '')} {job_description}"
                    skills_extracted = job_service.extract_skills(text_to_analyze)

                    if skills_extracted:
                        print(f"    Found skills: {skills_extracted[:5]}")

                    update_data = {
                        "sector": sector,
                        "stack": stack,
                        "pitch": pitch,
                        "description": description,
                        "job_description": job_description[:4000] if job_description else None,
                        "skills_extracted": skills_extracted,
                    }

                    supabase.table("jobs").update(update_data).eq("external_id", job["external_id"]).execute()
                    enriched_count += 1
                    jobs_scraped += 1

                    await asyncio.sleep(0.5)

                except Exception as e:
                    print(f"Failed to process job {job.get('title', 'unknown')}: {e}")
                    try:
                        supabase.table("jobs").update(
                            {"sector": sector, "stack": stack, "pitch": pitch, "description": description}
                        ).eq("external_id", job["external_id"]).execute()
                        enriched_count += 1
                    except:
                        pass

        return ScrapeResponse(
            success=True,
            count=len(db_jobs),
            message=f"Scraped {len(db_jobs)} jobs. Enriched {enriched_count}. Job pages scraped: {jobs_scraped}.",
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# STRUCTURED ENRICHMENT (quality fixed)
# ============================================================

JobFamily = Literal["software", "data", "ml_ai", "devops", "product", "design", "marketing", "sales", "other"]
AIRelevance = Literal["core", "adjacent", "buzzword", "none"]
RoleLabel = Literal[
    "frontend", "backend", "fullstack", "mobile", "devops", "sre",
    "data_engineer", "data_scientist", "ml_engineer", "llm_engineer",
    "security", "product", "design", "other"
]


class EnrichedJob(BaseModel):
    is_tech: bool
    job_family: JobFamily
    role_labels: List[RoleLabel] = []
    ai_relevance: AIRelevance
    ai_signals_strong: List[str] = []
    ai_signals_weak: List[str] = []
    skills_norm: List[str] = []
    summary_1l: str = ""
    suggested_outreach_roles: List[str] = []
    evidence: List[str] = []
    confidence: Optional[float] = None

    class Config:
        extra = "ignore"  # FIX: ignore extra fields from Gemini


ENRICH_PROMPT = """You are a strict classifier for job posts.
Return ONLY valid JSON matching the schema. No markdown, no explanation.
Rules:
- role_labels must be from: frontend, backend, fullstack, mobile, devops, sre,
  data_engineer, data_scientist, ml_engineer, llm_engineer, security, product, design, other
- ai_relevance:
  - core: mentions strong AI signals (LLM/RAG/finetuning/embeddings/inference/NLP)
  - adjacent: AI exists but not central (data infra, MLOps, analytics with ML)
  - buzzword: AI mentioned as marketing only (no strong signals)
  - none: no AI.
- is_tech: true if it requires technical skills (coding, data, infra)
Schema:
{
  "is_tech": boolean,
  "job_family": "software|data|ml_ai|devops|product|design|marketing|sales|other",
  "role_labels": ["string"],
  "ai_relevance": "core|adjacent|buzzword|none",
  "ai_signals_strong": ["string"],
  "ai_signals_weak": ["string"],
  "skills_norm": ["string"],
  "summary_1l": "one line summary",
  "suggested_outreach_roles": ["string", "string", "string"],
  "evidence": ["string"],
  "confidence": number (0-1)
}
Input:
TITLE: {title}
COMPANY: {company}
DESCRIPTION: {description}
"""


# ============================================================
# 5.B LAZY ENRICHMENT - TOP 50 STRATEGY
# ============================================================

class OutreachSuggestion(BaseModel):
    """A single outreach role suggestion"""
    role_title: str
    fit_type: str  # DIRECT, ADJACENT, BRIDGE
    rationale: str
    confidence: int
    key_tasks: List[str] = []

class CompanyDiagnostic(BaseModel):
    main_hiring_areas: List[str]
    match_level: str

class CompanyEnrichment(BaseModel):
    """AI-generated suggestions for a company"""
    diagnostic: Optional[CompanyDiagnostic] = None
    suggestions: List[OutreachSuggestion] = []
    
    class Config:
        extra = "ignore"

LAZY_ENRICHMENT_PROMPT = """
ROLE: Expert en Stratégie de Carrière & Recrutement (Spécialisation Alternance/Junior).
MISSION: Analyser l'écosystème de recrutement d'une entreprise pour générer 3 pistes de candidature spontanée en alternance.

CONTEXTE CANDIDAT :
- Objectif : {user_objective}
- Compétences : {user_skills}

CONTEXTE ENTREPRISE (OFFRES AGREGÉES) :
{aggregated_company_context}

MÉTHODOLOGIE D'ANALYSE (DIAGNOSTIC AVANT GÉNÉRATION) :
1. DÉTECTION : Quelles sont les familles de métiers dominantes dans les offres (ex: Engineering, Product, Sales, Data...) ?
2. MAPPING : Compare l'objectif du candidat avec ces familles.
   - Si ça matche parfaitement -> Focus sur des rôles "Junior/Support" dans cette équipe.
   - Si ça ne matche pas -> Cherche des rôles "Transverses" ou "Outils internes" (Bridge).
3. RÉALISME : Un alternant ne remplace pas un Senior. Il le soutient.

RÈGLES D'OR (ANTI-HALLUCINATION) :
1. ANCRAGE STRICT : Chaque proposition doit être justifiée par une technologie ou un pôle existant dans les offres. (Si pas de Python dans les offres, pas de proposition Python).
2. NIVEAU JUNIOR : Interdit de proposer "Manager", "Head of", "Architecte". Utilise : "Assistant", "Junior", "Support", "Chargé de mission", "Développeur".
3. DIVERSITÉ DES PISTES :
   - Piste 1 (Directe) : Le poste rêvé adapté en junior (ou le plus proche possible).
   - Piste 2 (Opérationnelle) : Aide sur les outils, la qualité (QA), la documentation ou les tests.
   - Piste 3 (Ouverture/Bridge) : Un rôle hybride qui mêle les compétences du candidat aux besoins business de la boîte.

FORMAT DE SORTIE (JSON STRICT) :
{{
  "diagnostic": {{
    "main_hiring_areas": ["Liste des départements qui recrutent (ex: Tech, Sales)"],
    "match_level": "High/Medium/Low"
  }},
  "suggestions": [
    {{
      "role_title": "Titre du poste (ex: Alternant Data Engineer - Support Pipeline)",
      "fit_type": "DIRECT", 
      "rationale": "Phrase expliquant la valeur ajoutée (ex: 'L'équipe Data grandit, je peux gérer la maintenance des pipelines ETL pour décharger les Seniors.')",
      "confidence": 90,
      "key_tasks": ["Exemple de tâche 1 (ex: Tests unitaires)", "Exemple de tâche 2"]
    }},
    {{
      "role_title": "Titre du poste (ex: QA & Automatisation des Tests)",
      "fit_type": "ADJACENT",
      "rationale": "...",
      "confidence": 75,
      "key_tasks": ["...", "..."]
    }},
    {{
      "role_title": "...",
      "fit_type": "BRIDGE",
      "rationale": "...",
      "confidence": 60,
      "key_tasks": ["...", "..."]
    }}
  ]
}}
"""



def extract_json_object(text: str) -> str:
    """
    Robustly extract JSON object from Gemini output.
    FIX: JSON parsing fragile -> extract object and json.loads it.
    """
    if not text:
        raise ValueError("Empty Gemini response")

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found in Gemini response")

    return text[start : end + 1]


class EnrichResponse(BaseModel):
    success: bool
    processed: int
    success_count: int
    failed: int
    skipped: int
    dry_run: bool
    message: str
    details: List[dict] = []


@app.get("/enrich/structured", response_model=EnrichResponse)
async def enrich_structured(limit: int = 30, force: bool = False, version: int = 1, dry_run: bool = False):
    """
    Structured enrichment endpoint:
    - Takes jobs WITH job_description already present (enriched scrape)
    - Calls Gemini with strict JSON schema
    - Validates with Pydantic EnrichedJob
    - Updates Supabase with structured fields
    - Stores raw JSON in enrichment_json for debugging
    """
    try:
        resp = supabase.table("jobs").select("*").eq("source", "stationf").execute()
        jobs = resp.data or []

        # Only jobs that have job_description (and optionally not already enriched to this version)
        candidates = []
        for j in jobs:
            if not j.get("job_description"):
                continue
            if not force:
                if j.get("enrichment_version") == version:
                    continue
            candidates.append(j)

        to_process = candidates[:limit]

        print(f"🔬 Starting structured enrichment (limit={len(to_process)}, version={version})")

        model = genai.GenerativeModel("gemini-2.5-flash")

        processed = 0
        ok = 0
        failed = 0
        skipped = 0
        details = []

        for job in to_process:
            processed += 1
            title = job.get("title") or ""
            company = job.get("company_name") or "Unknown"

            # FIX: no sector fallback. Only job_description or ""
            description = job.get("job_description") or ""

            print(f"  → {title[:50]} @ {company}")

            prompt = ENRICH_PROMPT.format(title=title, company=company, description=description)

            try:
                res = model.generate_content(prompt)
                raw_text = getattr(res, "text", None) or str(res)

                json_str = extract_json_object(raw_text)
                payload = json.loads(json_str)

                enriched = EnrichedJob(**payload)

                update_data = {
                    "is_tech": enriched.is_tech,
                    "job_family": enriched.job_family,
                    "role_labels": list(enriched.role_labels),
                    "ai_relevance": enriched.ai_relevance,
                    "ai_signals_strong": enriched.ai_signals_strong,
                    "ai_signals_weak": enriched.ai_signals_weak,
                    "skills_norm": enriched.skills_norm,
                    "summary_1l": enriched.summary_1l,
                    "suggested_outreach_roles": enriched.suggested_outreach_roles,
                    "evidence": enriched.evidence,
                    "confidence": enriched.confidence,
                    "enrichment_version": version,
                    "enrichment_json": payload,
                }

                if not dry_run:
                    supabase.table("jobs").update(update_data).eq("external_id", job["external_id"]).execute()

                ok += 1
                details.append(
                    {
                        "title": title,
                        "company": company,
                        "is_tech": enriched.is_tech,
                        "ai_relevance": enriched.ai_relevance,
                        "role_labels": list(enriched.role_labels),
                    }
                )

                print(f"    ✅ is_tech={enriched.is_tech}, ai={enriched.ai_relevance}, roles={list(enriched.role_labels)}")

            except ValidationError as ve:
                failed += 1
                details.append({"title": title, "company": company, "error": "validation", "detail": str(ve)[:500]})
                print(f"    ❌ ValidationError: {ve}")

            except Exception as e:
                failed += 1
                details.append({"title": title, "company": company, "error": "runtime", "detail": str(e)[:500]})
                print(f"    ❌ Error: {e}")

        return EnrichResponse(
            success=True,
            processed=processed,
            success_count=ok,
            failed=failed,
            skipped=skipped,
            dry_run=dry_run,
            message=f"Enrichment complete: {ok} success, {failed} failed",
            details=details,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# 6. LAZY ENRICHMENT ENDPOINT - TOP 50 STRATEGY
# ============================================================

class LazyEnrichResponse(BaseModel):
    success: bool
    companies_processed: int
    companies_enriched: int
    companies_failed: int
    dry_run: bool
    message: str
    details: List[dict] = []


@app.get("/enrich/lazy-top50", response_model=LazyEnrichResponse)
async def enrich_lazy_top50(
    limit: int = 50,
    dry_run: bool = False,
    force: bool = False,
    user_id: Optional[str] = None
):
    """
    Lazy Enrichment Strategy - Top 50 Companies
    
    1. Groups all jobs by company_name
    2. Calculates MAX(job.score) per company (not average)
    3. Takes only Top 50 companies by score
    4. Aggregates job context (titles + descriptions) per company
    5. Calls Gemini once per company with the strategic prompt
    6. Stores AI suggestions in jobs table (suggested_outreach_roles field)
    
    Args:
        user_id: Optional user ID to fetch profile from Supabase. If not provided, uses default values.
    """
    try:
        # Default profile - MUST match frontend JobDetailView.jsx defaults
        user_skills_list = ["Python", "React", "Data"]  # Match frontend default
        user_skills = ", ".join(user_skills_list)
        user_objective = "Développeur Fullstack"  # Match frontend default
        
        if user_id:
            print(f"📋 Fetching profile for user: {user_id}")
            # Use Admin client to bypass RLS if available
            client_to_use = supabase_admin if supabase_admin else supabase
            
            profile_resp = client_to_use.table("profiles").select("*").eq("user_id", user_id).single().execute()
            if profile_resp.data:
                profile = profile_resp.data
                # Match frontend: uses skills array, and goal_type/desired_position for objective
                user_skills_list = profile.get("skills") or ["Python", "React", "Data"]
                user_skills = ", ".join(user_skills_list)
                # Frontend uses: objective || desired_position || goal_type
                user_objective = (
                    profile.get("desired_position") or 
                    profile.get("goal_type") or 
                    "Développeur Fullstack"
                )
                print(f"   → Skills: {user_skills[:50]}...")
                print(f"   → Objective: {user_objective[:50]}...")
        
        # Create user profile object for matching algorithm (using SimpleNamespace for attribute access)
        from types import SimpleNamespace
        user_profile_for_matching = SimpleNamespace(
            skills=user_skills_list,
            objectif=user_objective
        )
        
        print(f"\n🎯 Starting Lazy Enrichment (Top {limit} companies, dry_run={dry_run})")
        
        # Fetch all jobs with descriptions using pagination helper
        jobs = fetch_all_jobs(supabase, require_desc=True)
        
        print(f"   Found {len(jobs)} jobs with descriptions")
        
        if not jobs:
            return LazyEnrichResponse(
                success=True,
                companies_processed=0,
                companies_enriched=0,
                companies_failed=0,
                dry_run=dry_run,
                message="No jobs with descriptions found"
            )
        
        # Step 1: Group jobs by company
        companies_dict: Dict[str, dict] = {}
        
        for job in jobs:
            company_name = job.get("company_name") or "Unknown"
            
            if company_name not in companies_dict:
                companies_dict[company_name] = {
                    "name": company_name,
                    "jobs": [],
                    "max_score": 0,
                    "job_ids": [],
                    "already_enriched": False
                }
            
            # Check if already enriched (has non-empty suggested_outreach_roles)
            existing_suggestions = job.get("suggested_outreach_roles") or []
            if existing_suggestions and not force:
                companies_dict[company_name]["already_enriched"] = True
            
            companies_dict[company_name]["jobs"].append(job)
            companies_dict[company_name]["job_ids"].append(job.get("id"))
            
            # Calculate REAL job score using the matching algorithm
            match_result = compute_job_match_score(user_profile_for_matching, job, None)
            if match_result:
                job_score = match_result.get("score", 0)
            else:
                job_score = 0
            
            companies_dict[company_name]["max_score"] = max(
                companies_dict[company_name]["max_score"],
                job_score
            )
        
        print(f"   Grouped into {len(companies_dict)} unique companies")
        
        # Step 2: Sort by max_score and take top N
        companies_list = sorted(
            companies_dict.values(),
            key=lambda x: x["max_score"],
            reverse=True
        )
        
        # Filter out already enriched companies (unless force=True)
        if not force:
            companies_list = [c for c in companies_list if not c["already_enriched"]]
        
        top_companies = companies_list[:limit]
        
        print(f"   Processing Top {len(top_companies)} companies")
        
        # Initialize Gemini model
        model = genai.GenerativeModel("gemini-2.5-flash-lite")
        
        enriched = 0
        failed = 0
        details = []
        
        for company in top_companies:
            company_name = company["name"]
            
            # Early return for dry_run - skip all processing
            if dry_run:
                print(f"   → {company_name} ({len(company['jobs'])} jobs)... SKIPPED (dry_run)")
                details.append({
                    "company": company_name,
                    "jobs_count": len(company["jobs"]),
                    "status": "skipped",
                    "reason": "dry_run"
                })
                continue
            
            try:
                # Step 3: Aggregate job context
                context_parts = [f"ENTREPRISE: {company_name}"]
                context_parts.append(f"NOMBRE DE POSTES OUVERTS: {len(company['jobs'])}")
                context_parts.append("\nPOSTES DÉTECTÉS (CONTEXTE) :")
                
                # Sort jobs by matching score to prioritize relevant ones for context
                # We can't use 'score' directly from the group, so let's just pick the first 5
                # Assuming the company["jobs"] list isn't strictly sorted by match, but that's fine for context.
                # Actually, let's just take the first 5 jobs.
                
                jobs_to_include = company["jobs"][:5] # Max 5 jobs FULL CONTEXT
                
                for i, job in enumerate(jobs_to_include, 1):
                    title = job.get("title") or "Unknown"
                    desc = (job.get("job_description") or "")[:2000]  # INCREASED LIMIT to 2000 chars
                    context_parts.append(f"\n--- Poste {i}: {title} ---")
                    context_parts.append(desc)
                
                aggregated_context = "\n".join(context_parts)
                
                # Step 4: Call Gemini with the strategic prompt
                prompt = LAZY_ENRICHMENT_PROMPT.format(
                    aggregated_company_context=aggregated_context,
                    user_skills=user_skills,
                    user_objective=user_objective
                )
                
                print(f"   → {company_name} ({len(company['jobs'])} jobs)...", end=" ")
                
                res = model.generate_content(prompt)
                raw_text = getattr(res, "text", None) or str(res)
                
                # Debug: Log raw response
                print(f"\n   DEBUG raw_text[:200]: {raw_text[:200]}", flush=True)
                
                # Parse response
                json_str = extract_json_object(raw_text)
                print(f"\n   DEBUG json_str[:200]: {json_str[:200]}", flush=True)
                
                payload = json.loads(json_str)
                
                # Validate with Pydantic
                enrichment = CompanyEnrichment(**payload)
                
                # Convert suggestions to list of role titles for storage
                role_titles = [s.role_title for s in enrichment.suggestions]
                
                # Step 5: Update all jobs for this company with suggestions
                for job_id in company["job_ids"]:
                     # Use Admin client for writes if possible (safer for background tasks)
                    client_to_use = supabase_admin if supabase_admin else supabase
                    client_to_use.table("jobs").update({
                        "suggested_outreach_roles": role_titles,
                        # Store full response for debugging and UI display (diagnostic, etc.)
                        "enrichment_json": payload  
                    }).eq("id", job_id).execute()
                
                print("✅")
                enriched += 1
                details.append({
                    "company": company_name,
                    "jobs_count": len(company["jobs"]),
                    "suggestions": [s.dict() for s in enrichment.suggestions],
                    "status": "success"
                })
                
                # Rate limiting: 5 second delay to stay under Gemini quota (15 req/min)
                import time
                time.sleep(5)
                
            except Exception as e:
                print(f"❌ {str(e)[:50]}")
                failed += 1
                details.append({
                    "company": company_name,
                    "jobs_count": len(company["jobs"]),
                    "status": "failed",
                    "error": str(e)
                })
        
        return LazyEnrichResponse(
            success=True,
            companies_processed=len(top_companies),
            companies_enriched=enriched,
            companies_failed=failed,
            dry_run=dry_run,
            message=f"Lazy enrichment complete: {enriched} enriched, {failed} failed",
            details=details
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# CONTACT FINDER ENDPOINT
# ============================================================

class FindEmailsRequest(BaseModel):
    company_name: str = Field(..., description="Nom de l'entreprise (ex: OVRSEA, Doctolib)")
    domain: Optional[str] = Field(None, description="Domaine manuel (ex: ovrsea.com)")
    first_name: Optional[str] = Field(None, description="Prenom du CEO (override)")
    last_name: Optional[str] = Field(None, description="Nom du CEO (override)")

@app.post("/api/find-emails")
async def api_find_emails(request: FindEmailsRequest):
    """
    Pipeline Contact Finder :
    1. DDG -> Domaine commercial
    2. Pappers -> CEO / President (+ DDG fallback)
    3. Email Permutation + SMTP Verification
    """
    try:
        result = find_contact(
            company_name=request.company_name,
            domain_override=request.domain,
            first_name=request.first_name,
            last_name=request.last_name,
        )

        if not result:
            raise HTTPException(
                status_code=404,
                detail=f"Aucun resultat pour '{request.company_name}'. Essayez avec --domain."
            )

        return {
            "success": True,
            "company": {
                "brand": request.company_name,
                "legal_name": result.get("nom_entreprise", request.company_name),
                "siren": result.get("siren"),
                "domain": result.get("domain"),
            },
            "ceo": {
                "name": result.get("full_name"),
                "title": result.get("qualite"),
            },
            "email": result.get("email"),
            "email_status": result.get("email_status"),
            "email_candidates": result.get("email_candidates", []),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# RUN (optional)
# ============================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api_server:app", host="127.0.0.1", port=8000, reload=False)