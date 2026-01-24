# JobService - You'll build this step by step!
# Reference: .tmp/old-jobservice.py

import json
import re
import requests
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

import google.generativeai as genai
from bs4 import BeautifulSoup


# ----------------------------
# Models
# ----------------------------

class CompanyAnalysis(BaseModel):
    sector: str = "Unknown"
    stack: List[str] = Field(default_factory=list)
    pitch: str = ""


# ----------------------------
# Helpers
# ----------------------------

def _clean_whitespace(s: str) -> str:
    s = re.sub(r"\s+", " ", s or "").strip()
    return s


def _extract_json_object(text: str) -> str:
    """
    Extract first JSON object from a model output.
    Works even if Gemini adds extra text around JSON.
    """
    if not text:
        raise ValueError("Empty model response")

    start = text.find("{")
    end = text.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise ValueError("No JSON object found")

    return text[start : end + 1]


def _contains_kw(text: str, kw: str) -> bool:
    kw = (kw or "").lower().strip()
    if not kw:
        return False
    t = (text or "").lower()
    if " " in kw:
        return kw in t
    return re.search(rf"\b{re.escape(kw)}\b", t) is not None


def _default_headers() -> Dict[str, str]:
    return {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                      "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

def _extract_visible_text_from_html(html: str) -> str:
    soup = BeautifulSoup(html or "", "html.parser")

    # remove junk
    for tag in soup(["script", "style", "noscript", "svg"]):
        tag.decompose()

    text = soup.get_text(separator=" ")
    return _clean_whitespace(text)


# ----------------------------
# Skill extraction (MVP)
# ----------------------------

COMMON_SKILLS = [
    # Languages
    "python", "javascript", "typescript", "java", "c", "c++", "go", "rust", "php", "scala", "kotlin",
    # Web / Backend
    "fastapi", "django", "flask", "node", "nodejs", "express", "spring", "nestjs",
    # Front
    "react", "nextjs", "vue", "angular", "html", "css",
    # Data
    "sql", "postgres", "postgresql", "mysql", "mongodb", "redis", "spark", "hadoop", "airflow", "dbt",
    # ML/AI
    "machine learning", "deep learning", "nlp", "llm", "rag", "embeddings", "fine-tuning", "pytorch", "tensorflow",
    # Infra
    "docker", "kubernetes", "aws", "gcp", "azure", "linux", "terraform", "ci/cd",
]

SKILL_SYNONYMS = {
    "node.js": "nodejs",
    "node": "nodejs",
    "next.js": "nextjs",
    "react.js": "react",
    "postgres": "postgresql",
    "k8s": "kubernetes",
}


def _normalize_skill(s: str) -> str:
    s = (s or "").lower().strip()
    if not s:
        return ""
    return SKILL_SYNONYMS.get(s, s)


# ----------------------------
# JobService
# ----------------------------

class JobService:
    """
    Minimal service used by api_server.py

    - scrape_description(company): try to find a short company description
    - analyze_company(company, description, titles): Gemini JSON -> CompanyAnalysis
    - scrape_job_page(url): download job page and return cleaned text
    - extract_skills(text): heuristic extraction
    """

    def __init__(self, api_key: str):
        self.api_key = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    async def scrape_description(self, company: str) -> str:
        """
        Version Améliorée : Récupère les 3 premiers résumés DuckDuckGo
        pour donner un maximum de contexte à Gemini.
        """
        company = (company or "").strip()
        if not company:
            return ""

        try:
            q = requests.utils.quote(f"{company} startup description")
            url = f"https://duckduckgo.com/html/?q={q}"
            
            # On va vite (timeout 10s) et on se déguise (headers)
            r = requests.get(url, headers=_default_headers(), timeout=10)
            if r.status_code != 200:
                return ""

            soup = BeautifulSoup(r.text, "html.parser")
            
            # CHANGEMENT ICI : on prend tous les snippets, pas juste le premier
            snippets = soup.select(".result__snippet")
            
            if not snippets:
                return ""

            # On garde les 3 premiers, on nettoie le texte, et on les colle ensemble
            combined_text = []
            for s in snippets[:3]:
                text = _clean_whitespace(s.get_text(" "))
                if text:
                    combined_text.append(text)
            
            # On retourne une grosse chaîne : "Résumé 1 | Résumé 2 | Résumé 3"
            return " | ".join(combined_text)

        except Exception:
            return ""

    async def analyze_company(self, company: str, description: str, titles: List[str]) -> CompanyAnalysis:
        """
        Gemini analysis to infer:
        - sector: "FinTech", "HealthTech", "SaaS", ...
        - stack: short list of tags (Frontend, Backend, Data, ML, DevOps...)
        - pitch: 1-liner company pitch
        """
        titles = titles or []
        description = description or ""

        prompt = f"""
You are a strict company classifier for startup job context.
Return ONLY valid JSON. No markdown, no explanation.

Schema:
{{
  "sector": "string (short, e.g. FinTech, SaaS, HealthTech, Marketplace, AI, DevTools, Cybersecurity, EdTech, etc.)",
  "stack": ["short tags like Backend, Frontend, Fullstack, Data, ML, DevOps, Product, Security (max 6)"],
  "pitch": "one sentence describing what the company does"
}}

Input:
COMPANY: {company}
DESCRIPTION: {description}
JOB_TITLES: {titles[:15]}
"""

        res = self.model.generate_content(prompt)
        raw_text = getattr(res, "text", None) or str(res)
        json_str = _extract_json_object(raw_text)
        data = json.loads(json_str)

        # sanitize
        if not isinstance(data.get("stack", []), list):
            data["stack"] = []

        return CompanyAnalysis(**data)

    async def scrape_job_page(self, url: str) -> str:
        """
        Download the job page and return visible text (cleaned).
        """
        if not url:
            return ""

        try:
            r = requests.get(url, headers=_default_headers(), timeout=15)
            if r.status_code != 200:
                return ""
            text = _extract_visible_text_from_html(r.text)

            # optional: keep it focused by removing very short results
            if len(text) < 200:
                return ""

            return text
        except Exception:
            return ""

    def extract_skills(self, text: str) -> List[str]:
        """
        Simple heuristic skill extraction.
        Returns a list of matched skills (normalized, deduplicated).
        """
        t = (text or "").lower()
        found = []

        for s in COMMON_SKILLS:
            if _contains_kw(t, s):
                found.append(_normalize_skill(s))

        # Deduplicate while preserving order
        seen = set()
        out = []
        for s in found:
            if s and s not in seen:
                seen.add(s)
                out.append(s)

        return out[:30]