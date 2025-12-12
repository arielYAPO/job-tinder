import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Supabase (server-side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        // 1. Get user_id and job_id from request body
        const { user_id, job_id } = await request.json();

        // 2. Fetch user profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', user_id)
            .single();

        // 3. Fetch experiences
        const { data: experiences } = await supabase
            .from('experiences')
            .select('*')
            .eq('user_id', user_id);

        // 4. Fetch education
        const { data: education } = await supabase
            .from('education')
            .select('*')
            .eq('user_id', user_id);

        // 5. Fetch job details
        const { data: job } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', job_id)
            .single();

        // DEBUG: Log fetched data
        console.log('=== CV Generation Debug ===');
        console.log('User ID:', user_id);
        console.log('Experiences fetched:', experiences);
        console.log('Education fetched:', education);
        console.log('Profile:', profile);
        console.log('Job:', job?.title);

        // 6. Build experience text
        const experienceText = experiences && experiences.length > 0
            ? experiences.map((exp, i) => `
Experience ${i + 1}:
- Job Title: ${exp.job_title}
- Company: ${exp.company}
- Duration: ${exp.start_date} to ${exp.is_current ? 'Present' : exp.end_date}
- Description: ${exp.description || 'N/A'}
`).join('\n')
            : 'No work experience provided';

        // 7. Build education text
        const educationText = education && education.length > 0
            ? education.map((edu, i) => `
Education ${i + 1}:
- Degree: ${edu.degree}
- School: ${edu.school}
- Field: ${edu.field_of_study || 'N/A'}
- Year: ${edu.graduation_year || 'N/A'}
`).join('\n')
            : 'No education provided';

        // 8. Fetch projects
        const { data: projects } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user_id);

        const projectsText = projects && projects.length > 0
            ? projects.map((proj, i) => `
Project ${i + 1}:
- Title: ${proj.title}
- Description: ${proj.description || 'N/A'}
- Tech Stack: ${proj.tech_stack ? proj.tech_stack.join(', ') : 'N/A'}
`).join('\n')
            : 'No projects provided';

        // 9. Fetch certifications
        const { data: certifications } = await supabase
            .from('certifications')
            .select('*')
            .eq('user_id', user_id);

        const certsText = certifications && certifications.length > 0
            ? certifications.map((cert, i) => `
Certification ${i + 1}:
- Name: ${cert.name}
- Issuer: ${cert.issuer || 'N/A'}
- Date: ${cert.issue_date || 'N/A'}
`).join('\n')
            : 'No certifications provided';

        // 10. Build the ATS-OPTIMIZED CV prompt (targeting 90+ ATS score)
        const prompt = `You are an expert ATS resume optimizer. Your goal is to achieve a 90+ ATS match score.

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

        // 11. Call Gemini for CV
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        let cvText = result.response.text();

        // Clean up response (remove markdown code blocks if any)
        cvText = cvText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // ==========================================
        // 12. Generate Cover Letter (Lettre de Motivation)
        // ==========================================

        // Build achievements from projects
        const achievementsText = projects && projects.length > 0
            ? projects.map(proj => `• ${proj.title}: ${proj.description || 'Projet technique'} (${proj.tech_stack ? proj.tech_stack.join(', ') : 'N/A'})`).join('\n')
            : 'Aucune réalisation spécifiée';

        // Get today's date in French format
        const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

        const coverLetterPrompt = `You are a **senior HR expert + hiring manager**. Write a **classic, high-converting cover letter** in **French**, tailored to the job description and candidate info below.

### Hard rules (must follow)

* **Do NOT invent** facts (experience, numbers, tools, company info).
* If key info is missing, ask **max 3 questions** in \`"missing_info_questions"\` and still produce a best-effort letter using neutral phrasing.
* **No clichés** ("motivé", "dynamique", "passionné") unless backed by evidence.
* **No fluff**. Every sentence must add value.
* Use **active verbs**, short sentences, and **impact language**.
* Reuse **job description keywords naturally** (ATS-friendly), without keyword stuffing.
* **One page max** when pasted into a doc.
* Output must be **valid JSON only** (no markdown, no commentary).

### Inputs (use exactly)

JOB:
* company_name: ${job?.company_name || 'Entreprise'}
* role_title: ${job?.title || 'Poste'}
* contract_type: Alternance
* location: ${job?.location_city || 'France'}
* recruiter_name (optional): 
* job_description_full:
${job?.description || 'Non spécifiée'}

CANDIDATE:
* name: ${profile?.full_name || 'Candidat'}
* email: ${profile?.email || ''}
* phone: ${profile?.phone || ''}
* location: ${profile?.location || 'France'}
* links (LinkedIn/Portfolio/GitHub): ${profile?.linkedin_url || ''} ${profile?.github_url || ''} ${profile?.portfolio_url || ''}
* cv_summary:
${profile?.bio || 'Non spécifié'}

Education:
${educationText}

Experience:
${experienceText}

* achievements (quantified if possible):
${achievementsText}

* key_skills: ${profile?.skills ? profile.skills.join(', ') : job?.skills ? job.skills.join(', ') : 'Non spécifié'}

### Required letter structure (classic, 3 paragraphs)

Include:
**Header (top of letter)**
* Candidate name
* Candidate location • phone • email • links
* Date: ${today}
* Company name — Role title

**Greeting**
* "Madame, Monsieur,"

**Paragraph 1 (Hook)**
* Show you understood their main need + why you fit
* Include 1 proof (achievement/project) if available

**Paragraph 2 (Proof)**
* 2–3 strong proofs aligned to JD (skills + achievements)
* At least **2 measurable results** if provided, otherwise qualitative impacts without inventing numbers

**Paragraph 3 (Fit + CTA)**
* Why this company (specific, based on input)
* Clear CTA: propose an interview
* Polite closing

### Output format (strict JSON)

Return ONLY this JSON:

{
  "cover_letter": "Full cover letter as single string with \\n for line breaks",
  "missing_info_questions": []
}

Rules:
* If nothing missing: \`"missing_info_questions": []\`
* The cover letter must be **one single string** with line breaks \`\\n\`.
* NO markdown, NO commentary, ONLY valid JSON.`;

        const coverLetterResult = await model.generateContent(coverLetterPrompt);
        let coverLetterText = coverLetterResult.response.text();

        // Clean up response
        coverLetterText = coverLetterText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // 13. Save both CV and Cover Letter to database
        const { error: dbError } = await supabase.from('generated_cvs').insert({
            user_id,
            job_id,
            cv_content: cvText,
            cover_letter: coverLetterText
        });

        if (dbError) {
            console.error('Database insert error:', dbError);
        }

        // 14. Return both results
        return Response.json({
            success: true,
            cv: cvText,
            cover_letter: coverLetterText
        });

    } catch (error) {
        console.error('Error generating CV:', error);

        // Check for rate limit error
        if (error.status === 429 || error.message?.includes('429')) {
            return Response.json({
                success: false,
                error: 'Rate limit reached. Please wait a minute and try again.'
            }, { status: 429 });
        }

        return Response.json({
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
}