// ============================================================================
// CV GENERATION PROMPT
// ============================================================================

/**
 * Build the CV generation prompt
 * @param {Object} data - Contains profile, experienceText, educationText, projectsText, certsText, job
 * @returns {string} The prompt string
 */
export function buildCVPrompt({ profile, experienceText, educationText, projectsText, certsText, job }) {
  return `You are an expert ATS resume optimizer. Your goal is to achieve a 90+ ATS match score.

**IMPORTANT: Generate ALL CV content in FRENCH.** The JSON keys remain in English, but all text values (titles, summaries, bullets, skills descriptions) must be in French.

=== CORE RULES (NON-NEGOTIABLE) ===
1. Use ONLY information provided by the user - NEVER invent data
2. Do NOT fabricate companies, degrees, tools, or metrics
3. You CAN rephrase and enhance truthful content
4. Prioritize PROJECTS over experience for apprenticeship candidates
5. ALL OUTPUT TEXT MUST BE IN FRENCH

=== ATS OPTIMIZATION RULES ===
1. **KEYWORD FORCING**: Extract top 10 hard skills from the job description. These MUST appear in:
   - Skills section (all 10)
   - Professional summary (at least 3)
   - Project bullets (at least 5 distributed across projects)
   
2. **TITLE MATCHING**: The tailored_title MUST closely match the job title format:
   - Use the EXACT job title from the posting (in French)
   - Add " — " then top 3 technical skills
   - Example: "Développeur Full Stack (Alternance) — React / Node.js / MongoDB"

3. **WORD COUNT**: Target 550-650 words total. This is optimal for ATS + readability.

4. **QUANTIFIED IMPACT**: Every project/experience needs lightweight metrics. Use these patterns (in French):
   - "Développé X écrans/pages/composants"
   - "Amélioré les performances en optimisant..."
   - "Déployé pour X utilisateurs"
   - "Automatisé X étapes manuelles"
   - "Réduit le temps de chargement grâce au caching/optimisation"
   - If no real metrics, use SPECIFIC verbs: "Architecturé", "Optimisé", "Orchestré"

5. **SKILL CATEGORIES**: Group skills intelligently:
   - Frontend: React, TypeScript, CSS, etc.
   - Backend: Node.js, Python, SQL, NoSQL, etc.
   - DevOps/Outils: Git, Docker, AWS, Agile (Scrum)

=== CANDIDATE INFO ===
Name: ${profile?.full_name || 'Candidate'}
Location: ${profile?.location || 'Not specified'}
Skills: ${profile?.skills ? profile.skills.join(', ') : 'Not specified'}
Languages: ${profile?.languages ? profile.languages.join(', ') : 'Not specified'}
Bio: ${profile?.bio || 'Not provided'}

=== WORK EXPERIENCE ===
${experienceText}

=== EDUCATION ===
${educationText}

=== PROJECTS (prioritize for apprenticeship) ===
${projectsText}

=== CERTIFICATIONS ===
${certsText}

=== TARGET JOB (EXTRACT KEYWORDS FROM THIS) ===
Title: ${job?.title || 'Position'}
Company: ${job?.company_name || 'Company'}
Description: ${job?.description || 'No description'}
Required Skills: ${job?.skills ? job.skills.join(', ') : 'Not specified'}
Location: ${job?.location_city || 'Not specified'}

=== OUTPUT FORMAT ===
Return a JSON object with this EXACT structure (keys in English, values in FRENCH):
{
  "tailored_title": "[Titre du poste exact] — Compétence1 / Compétence2 / Compétence3",
  "professional_summary": "2-3 phrases EN FRANÇAIS avec au moins 3 mots-clés du poste intégrés naturellement. Mentionner le nom de l'entreprise. Format: Qui vous êtes + Ce que vous apportez + Pourquoi ce rôle.",
  "skills": ["8-12 compétences présentes DANS le profil ET la description du poste. Inclure les variations comme 'NoSQL (MongoDB)', 'Agile (Scrum)'"],
  "projects": [
    {
      "title": "Nom du Projet",
      "tech_stack": ["Technologies correspondant à l'offre"],
      "bullets": [
        "Verbe d'action + ce que vous avez construit + métrique ou impact spécifique (EN FRANÇAIS)",
        "Autre réalisation avec mot-clé de l'offre intégré",
        "Troisième point avec un autre mot-clé"
      ]
    }
  ],
  "education": [
    {
      "degree": "Nom du Diplôme",
      "field": "Domaine d'études", 
      "school": "Nom de l'École",
      "year": "AAAA"
    }
  ],
  "work_experience": [
    {
      "title": "Titre du Poste",
      "company": "Nom de l'Entreprise",
      "duration": "Début - Fin",
      "bullets": ["Verbe d'action + tâche + impact avec mot-clé (EN FRANÇAIS)"]
    }
  ],
  "certifications": [
    {"name": "Nom de la Certification", "issuer": "Organisme"}
  ],
  "languages": ["Langue (Niveau)"],
  "matched_keywords": ["Top 10 mots-clés de l'offre présents dans le CV"],
  "ats_optimization_notes": "Note brève sur le placement des mots-clés"
}

=== QUALITY CHECKLIST (VERIFY BEFORE OUTPUT) ===
✅ Titre correspond exactement au format de l'offre + stack technique
✅ Résumé contient 3+ mots-clés de l'offre
✅ Section compétences a 8-12 éléments incluant les exigences de l'offre
✅ Chaque projet a 2-3 points avec mots-clés de l'offre
✅ Chaque point commence par un verbe d'action fort
✅ Au moins 3 métriques légères sur l'ensemble des points
✅ Projets apparaissent AVANT l'expérience professionnelle
✅ Nombre total de mots: 550-650
✅ TOUT LE CONTENU EST EN FRANÇAIS

Generate now. Return ONLY valid JSON, no markdown.`;
}
