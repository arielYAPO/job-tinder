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

        // 10. Build the PRODUCT-GRADE ATS CV prompt
        const prompt = `You are an expert ATS resume writer. Your job is to POLISH and TAILOR, not INVENT.

=== CORE RULES (NON-NEGOTIABLE) ===
1. Use ONLY information provided by the user
2. Do NOT invent companies, degrees, tools, projects, or metrics
3. If metrics are not provided, write strong QUALITATIVE impact statements instead
4. Never fabricate numbers - use "improved", "enhanced", "streamlined" instead of fake percentages
5. Prioritize PROJECTS over experience for apprenticeship/internship candidates

=== WHAT YOU SHOULD DO ===
- Generate a tailored professional title from job title + top skills
- Extract top 10 hard skills from the job description
- Map them to candidate skills (only use matches that are truthful)
- Rewrite all bullets with: [Strong Action Verb] + [What was done] + [Qualitative Impact]
- Use clean, ATS-friendly single-column format
- Order sections: Title → Summary → Skills → Projects → Education → Experience → Certifications → Languages

=== CANDIDATE INFO ===
Name: ${profile?.full_name || 'Candidate'}
Location: ${profile?.location || 'Not specified'}
Skills: ${profile?.skills ? profile.skills.join(', ') : 'Not specified'}
Languages: ${profile?.languages ? profile.languages.join(', ') : 'Not specified'}
Bio: ${profile?.bio || 'Not provided'}

=== WORK EXPERIENCE (polish, don't invent) ===
${experienceText}

=== EDUCATION ===
${educationText}

=== PROJECTS (prioritize for apprenticeship) ===
${projectsText}

=== CERTIFICATIONS ===
${certsText}

=== TARGET JOB ===
Title: ${job?.title || 'Position'}
Company: ${job?.company_name || 'Company'}
Description: ${job?.description || 'No description'}
Required Skills: ${job?.skills ? job.skills.join(', ') : 'Not specified'}
Location: ${job?.location_city || 'Not specified'}

=== OUTPUT FORMAT ===
Return a JSON object with this EXACT structure:
{
  "tailored_title": "Job Title Apprentice — Top Skill 1 / Top Skill 2 / Top Skill 3",
  "professional_summary": "2-3 sentences: Who you are + What you bring + Why this role. Integrate job keywords naturally. Be specific to THIS job at THIS company.",
  "skills": ["Top 8-12 skills that MATCH both candidate profile AND job requirements"],
  "projects": [
    {
      "title": "Project Name",
      "description": "1-2 sentences: What it does + your contribution",
      "tech_stack": ["Tech 1", "Tech 2"],
      "bullets": ["Achievement without fake metrics", "What you built or contributed"]
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "field": "Field of Study",
      "school": "School Name",
      "year": "YYYY"
    }
  ],
  "work_experience": [
    {
      "title": "Job Title",
      "company": "Company Name",
      "duration": "Start - End",
      "bullets": ["Use action verbs", "Qualitative impact only - no invented metrics", "What you actually did"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization"
    }
  ],
  "languages": ["Language (Level)"],
  "matched_keywords": ["Top 5-8 keywords from job description that match candidate profile"]
}

=== QUALITY CHECKLIST ===
- Every bullet starts with a strong action verb
- No bullet exceeds 2 lines
- No invented metrics or fake numbers
- Skills section only includes truthful matches
- Projects come BEFORE experience (apprenticeship optimization)
- Summary mentions the specific company and role

Generate now. Return ONLY valid JSON, no markdown code blocks.`;

        // 9. Call Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        let cvText = result.response.text();

        // Clean up response (remove markdown code blocks if any)
        cvText = cvText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        // 10. Save to database
        const { error: dbError } = await supabase.from('generated_cvs').insert({
            user_id,
            job_id,
            cv_content: cvText
        });

        if (dbError) {
            console.error('Database insert error:', dbError);
        }

        // 11. Return the result
        return Response.json({
            success: true,
            cv: cvText
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