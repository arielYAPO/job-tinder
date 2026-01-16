// Station F specific CV and Cover Letter generation
// Reuses existing buildCVPrompt from lib/prompts.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { buildCVPrompt } from "@/lib/prompts";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
  try {
    const {
      user_id,
      company_name,
      role_title,
      department,
      sector,
      company_description,
    } = await request.json();

    // Fetch user profile (includes experiences, education, projects as JSONB)
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user_id)
      .single();

    // Get data from profile JSONB columns (CV Builder data)
    const experiences = profile?.experiences || [];
    const education = profile?.education || [];
    const projects = profile?.projects || [];

    // Build text representations for AI prompt
    const experienceText = experiences && experiences.length > 0
      ? experiences.map((exp, i) => `
Experience ${i + 1}:
- Job Title: ${exp.title || exp.job_title || 'N/A'}
- Company: ${exp.company || 'N/A'}
- Duration: ${exp.start_date || ''} to ${exp.current ? 'Present' : (exp.end_date || '')}
- Description: ${exp.description || 'N/A'}
`).join('\n')
      : 'No work experience provided';

    const educationText = education && education.length > 0
      ? education.map((edu, i) => `
Education ${i + 1}:
- Degree: ${edu.degree || 'N/A'}
- School: ${edu.school || 'N/A'}
- Field: ${edu.field || edu.field_of_study || 'N/A'}
- Year: ${edu.end_year || edu.graduation_year || 'N/A'}
`).join('\n')
      : 'No education provided';

    const projectsText = projects && projects.length > 0
      ? projects.map((proj, i) => `
Project ${i + 1}:
- Title: ${proj.name || proj.title || 'N/A'}
- Description: ${proj.description || 'N/A'}
- Tech Stack: ${proj.skills || (proj.tech_stack ? proj.tech_stack.join(', ') : 'N/A')}
`).join('\n')
      : 'No projects provided';

    // No certifications in CV Builder for now
    const certsText = 'No certifications provided';

    // Create a "fake job" object for buildCVPrompt 
    // (Station F = candidature spontanée)
    const job = {
      title: role_title,
      company_name: company_name,
      description: company_description || `Candidature spontanée pour un poste de ${role_title} dans le département ${department}. Startup dans le secteur ${sector || 'Tech'} incubée à Station F.`,
      skills: profile?.skills || [],
      location_city: 'Paris (Station F)'
    };

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // ==========================================
    // 1. Generate CV using existing buildCVPrompt
    // ==========================================
    const cvPrompt = buildCVPrompt({
      profile,
      experienceText,
      educationText,
      projectsText,
      certsText,
      job
    });

    const cvResult = await model.generateContent(cvPrompt);
    let cvText = cvResult.response.text();
    cvText = cvText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // ==========================================
    // 2. Generate Cover Letter (spontaneous application)
    // Same prompt as /api/generate-cv
    // ==========================================
    const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    const achievementsText = projects && projects.length > 0
      ? projects.map(proj => `• ${proj.title}: ${proj.description || 'Projet technique'} (${proj.tech_stack ? proj.tech_stack.join(', ') : 'N/A'})`).join('\n')
      : 'Aucune réalisation spécifiée';

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
* THIS IS A SPONTANEOUS APPLICATION - the company has NOT posted a job offer.

### Inputs (use exactly)

JOB:
* company_name: ${company_name}
* role_title: ${role_title}
* department: ${department}
* sector: ${sector || 'Tech/Startup'}
* contract_type: Alternance
* location: Paris (Station F)
* company_description: ${company_description || 'Startup incubée à Station F'}

CANDIDATE:
* name: ${profile?.full_name || 'Candidat'}
* email: ${profile?.email || ''}
* phone: ${profile?.phone || ''}
* location: ${profile?.location || 'France'}
* links (LinkedIn/Portfolio/GitHub): ${profile?.linkedin_url || ''} ${profile?.github_url || ''} ${profile?.portfolio_url || ''}
* cv_summary: ${profile?.bio || 'Non spécifié'}

Education:
${educationText}

Experience:
${experienceText}

* achievements (quantified if possible):
${achievementsText}

* key_skills: ${profile?.skills ? profile.skills.join(', ') : 'Non spécifié'}

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
* This is a SPONTANEOUS application - mention you discovered them via Station F

**Paragraph 2 (Proof)**
* 2–3 strong proofs aligned to the role (skills + achievements)
* At least **2 measurable results** if provided, otherwise qualitative impacts without inventing numbers

**Paragraph 3 (Fit + CTA)**
* Why this company specifically
* Clear CTA: propose an interview
* Polite closing

### Output format (strict JSON)

Return ONLY this JSON:

{
  "cover_letter": "Full cover letter as single string with \\n for line breaks",
  "subject": "Email subject line",
  "missing_info_questions": []
}

Rules:
* If nothing missing: \`"missing_info_questions": []\`
* The cover letter must be **one single string** with line breaks \`\\n\`.
* NO markdown, NO commentary, ONLY valid JSON.`;

    const coverLetterResult = await model.generateContent(coverLetterPrompt);
    let coverLetterText = coverLetterResult.response.text();
    coverLetterText = coverLetterText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    return Response.json({
      success: true,
      cv: cvText,
      cover_letter: coverLetterText,
      company: company_name,
      role: role_title
    });

  } catch (error) {
    console.error('Error generating Station F CV:', error);

    if (error.status === 429 || error.message?.includes('429')) {
      return Response.json({
        success: false,
        error: 'Rate limit atteint. Réessaye dans 1 minute.'
      }, { status: 429 });
    }

    return Response.json({
      success: false,
      error: error.message || 'Erreur inconnue'
    }, { status: 500 });
  }
}
