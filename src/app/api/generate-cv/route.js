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

=== CORE RULES (NON-NEGOTIABLE) ===
1. Use ONLY information provided by the user - NEVER invent data
2. Do NOT fabricate companies, degrees, tools, or metrics
3. You CAN rephrase and enhance truthful content
4. Prioritize PROJECTS over experience for apprenticeship candidates

=== ATS OPTIMIZATION RULES ===
1. **KEYWORD FORCING**: Extract top 10 hard skills from the job description. These MUST appear in:
   - Skills section (all 10)
   - Professional summary (at least 3)
   - Project bullets (at least 5 distributed across projects)
   
2. **TITLE MATCHING**: The tailored_title MUST closely match the job title format:
   - Use the EXACT job title from the posting
   - Add " — " then top 3 technical skills
   - Example: "Développeur Full Stack (Alternance) — React / Node.js / MongoDB"

3. **WORD COUNT**: Target 550-650 words total. This is optimal for ATS + readability.

4. **QUANTIFIED IMPACT**: Every project/experience needs lightweight metrics. Use these patterns:
   - "Built X screens/pages/components"
   - "Improved performance by optimizing..."
   - "Deployed to X users/classmates"
   - "Automated X manual steps"
   - "Reduced load time through caching/optimization"
   - If no real metrics, use SPECIFIC verbs: "Architected", "Streamlined", "Orchestrated"

5. **SKILL CATEGORIES**: Group skills intelligently:
   - Frontend: React, TypeScript, CSS, etc.
   - Backend: Node.js, Python, SQL, NoSQL, etc.
   - DevOps/Tools: Git, Docker, AWS, Agile (Scrum)

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
Return a JSON object with this EXACT structure:
{
  "tailored_title": "[EXACT Job Title] — Skill1 / Skill2 / Skill3",
  "professional_summary": "2-3 sentences with AT LEAST 3 job keywords naturally integrated. Mention the company name. Format: Who you are + What you bring + Why this role.",
  "skills": ["8-12 skills that appear in BOTH candidate profile AND job description. Include variations like 'NoSQL (MongoDB)', 'Agile (Scrum)'"],
  "projects": [
    {
      "title": "Project Name",
      "tech_stack": ["Tech that matches JD"],
      "bullets": [
        "Action verb + what you built + lightweight metric or specific impact",
        "Another achievement with JD keyword integrated",
        "Third bullet with different JD keyword"
      ]
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
      "bullets": ["Action verb + task + impact with JD keyword"]
    }
  ],
  "certifications": [
    {"name": "Cert Name", "issuer": "Issuer"}
  ],
  "languages": ["Language (Level)"],
  "matched_keywords": ["Top 10 keywords from JD that are now in the resume"],
  "ats_optimization_notes": "Brief note on which keywords were placed where"
}

=== QUALITY CHECKLIST (VERIFY BEFORE OUTPUT) ===
✅ Title matches JD format exactly + has skill stack
✅ Summary has 3+ job keywords
✅ Skills section has 8-12 items including JD requirements
✅ Each project has 2-3 bullets with JD keywords
✅ Every bullet starts with strong action verb
✅ At least 3 lightweight metrics across all bullets
✅ Projects appear BEFORE work experience
✅ Total word count: 550-650 words

Generate now. Return ONLY valid JSON, no markdown.`;

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