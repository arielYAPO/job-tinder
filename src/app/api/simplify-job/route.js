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
        const { description, title, company, job_id } = await request.json();

        if (!description) {
            return Response.json({ error: 'No description provided' }, { status: 400 });
        }

        // Generate a cache key based on job_id or content hash
        const cacheKey = job_id || Buffer.from(description.slice(0, 500)).toString('base64').slice(0, 100);

        // 1. CHECK CACHE FIRST
        const { data: cached } = await supabase
            .from('simplified_jobs')
            .select('simplified_data')
            .eq('cache_key', cacheKey)
            .single();

        if (cached?.simplified_data) {
            console.log('✅ Returning cached simplification for:', cacheKey.slice(0, 20));
            return Response.json({
                success: true,
                data: cached.simplified_data,
                cached: true
            });
        }

        // 2. NOT CACHED - CALL GEMINI
        console.log('🤖 Calling Gemini for:', title);

        const prompt = `Tu es un assistant RH expert. Analyse cette offre d'emploi et extrais les informations clés de manière structurée.

=== OFFRE D'EMPLOI ===
Titre: ${title || 'Non spécifié'}
Entreprise: ${company || 'Non spécifiée'}
Description:
${description}

=== INSTRUCTIONS ===
Extrais et structure les informations suivantes. Sois concis et direct.

Retourne un JSON avec cette structure EXACTE:
{
  "summary": "Résumé en 1-2 phrases de ce que recherche l'entreprise",
  "missions": ["Mission 1", "Mission 2", "Mission 3", "..."],
  "tech_stack": ["Tech 1", "Tech 2", "..."],
  "requirements": ["Prérequis 1", "Prérequis 2", "..."],
  "soft_skills": ["Qualité 1", "Qualité 2", "..."],
  "perks": ["Avantage 1", "Avantage 2", "..."]
}

=== RÈGLES ===
1. Missions: 3-6 points max, commence par un verbe d'action
2. Tech stack: Liste les technologies/outils mentionnés (langages, frameworks, logiciels)
3. Requirements: Diplôme, expérience, certifications requises
4. Soft skills: Qualités personnelles recherchées
5. Perks: Avantages mentionnés (télétravail, formation, etc.)
6. Si une section n'a pas d'info, retourne un tableau vide []

Retourne UNIQUEMENT le JSON, pas de markdown.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        let responseText = result.response.text();

        // Clean up response
        responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const structured = JSON.parse(responseText);

        // 3. SAVE TO CACHE
        const { error: cacheError } = await supabase
            .from('simplified_jobs')
            .upsert({
                cache_key: cacheKey,
                job_title: title,
                company_name: company,
                simplified_data: structured,
                created_at: new Date().toISOString()
            }, {
                onConflict: 'cache_key'
            });

        if (cacheError) {
            console.error('Cache save error:', cacheError);
            // Don't fail the request, just log it
        } else {
            console.log('💾 Cached simplification for:', cacheKey.slice(0, 20));
        }

        return Response.json({
            success: true,
            data: structured,
            cached: false
        });

    } catch (error) {
        console.error('Simplify error:', error);

        if (error.status === 429 || error.message?.includes('429')) {
            return Response.json({
                success: false,
                error: 'Rate limit - please wait a moment'
            }, { status: 429 });
        }

        return Response.json({
            success: false,
            error: error.message || 'Failed to simplify'
        }, { status: 500 });
    }
}
