import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { buildCVPrompt } from "@/lib/prompts";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Supabase (server-side)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        // 1. Get user_id, job_id, and optional promptVersion from request body
        const { user_id, job_id, promptVersion = 'v2' } = await request.json();

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

        // 10. Build the CV prompt using versioned prompts
        console.log('Using prompt version:', promptVersion);
        const prompt = buildCVPrompt({
            profile,
            experienceText,
            educationText,
            projectsText,
            certsText,
            job
        }, promptVersion);

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