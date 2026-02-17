
import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request) {
    try {
        const supabase = await createClient();

        // ==========================================
        // ÉTAPE 0 - AUTHENTIFICATION
        // ==========================================
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non autorisé. Connectez-vous." }, { status: 401 });
        }

        // ==========================================
        // ÉTAPE 1 - RATE LIMIT (5 emails/jour)
        // ==========================================
        const { allowed, remaining } = await checkRateLimit(supabase, user.id, 'emails', 5);
        if (!allowed) {
            return NextResponse.json({
                success: false,
                rateLimited: true,
                remaining: 0,
                message: "💎 Limite atteinte : vous avez utilisé vos 5 recherches de contact pour aujourd'hui. Revenez demain !"
            });
        }

        const { company, job } = await request.json();

        if (!company || !job) {
            return NextResponse.json({ error: "Missing parameters: company and job are required" }, { status: 400 });
        }

        // ==========================================
        // ÉTAPE 2 - VÉRIFIER LE DOMAINE
        // ==========================================
        let domain = null;
        try {
            const { data } = await supabase
                .from('jobs')
                .select('company_url')
                .eq('company_name', company)
                .not('company_url', 'is', null)
                .neq('company_url', 'NOT_FOUND')
                .limit(1)
                .single();

            if (data && data.company_url) {
                domain = data.company_url;
            }
        } catch (e) {
            console.warn("Supabase lookup failed, will try without domain:", e);
        }

        if (!domain) {
            return NextResponse.json({
                success: false,
                message: "Domaine de l'entreprise introuvable dans la base de donnees"
            });
        }

        // ==========================================
        // ÉTAPE 3 - VÉRIFIER LE CACHE
        // ==========================================
        try {
            const { data: cachedContact } = await supabase
                .from('generated_contacts')
                .select('contact_name, contact_emails, linkedin_url')
                .eq('company_name', company)
                .eq('job_title', job)
                .single();

            if (cachedContact) {
                return NextResponse.json({
                    success: true,
                    name: cachedContact.contact_name,
                    emails: cachedContact.contact_emails || [],
                    linkedin: cachedContact.linkedin_url || null,
                    domain: domain,
                    remaining: remaining,
                    fromCache: true
                });
            }
        } catch (e) {
            // Pas en cache, on continue
        }

        // ==========================================
        // ÉTAPE 4 - RECHERCHE SERPER
        // ==========================================
        const serperApiKey = process.env.SERPER_API_KEY;
        if (!serperApiKey) {
            return NextResponse.json({ error: "Server misconfiguration: Missing API Key" }, { status: 500 });
        }

        const query = `site:fr.linkedin.com/in/ ${company} ${job}`;

        const serperResponse = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: {
                "X-API-KEY": serperApiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ q: query }),
        });

        if (!serperResponse.ok) {
            throw new Error(`Serper API error: ${serperResponse.statusText}`);
        }

        const data = await serperResponse.json();
        let foundName = null;
        let linkedinUrl = null;

        if (data.organic && data.organic.length > 0) {
            const firstResult = data.organic[0];
            foundName = firstResult.title.split("-")[0].split("|")[0].trim();
            linkedinUrl = firstResult.link;
        } else {
            return NextResponse.json({
                success: false,
                message: "Aucun contact trouve sur LinkedIn"
            });
        }

        // ==========================================
        // ÉTAPE 5 - GÉNÉRER LES 3 EMAILS + SAUVEGARDER
        // ==========================================
        const emails = generateEmailFormats(foundName, domain);

        if (foundName && emails.length > 0) {
            try {
                await supabase
                    .from('generated_contacts')
                    .insert([
                        {
                            company_name: company,
                            job_title: job,
                            contact_name: foundName,
                            contact_email: emails[0],
                            contact_emails: emails,
                            linkedin_url: linkedinUrl
                        }
                    ]);
            } catch (e) {
                console.error("Failed to save to cache:", e);
            }
        }

        return NextResponse.json({
            success: true,
            name: foundName,
            emails: emails,
            linkedin: linkedinUrl,
            domain: domain,
            remaining: remaining,
            confidence: "High",
            fromCache: false
        });

    } catch (error) {
        console.error("API Contact Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// La fonction qui genere les 3 formats
function generateEmailFormats(fullname, domain) {
    const cleanName = fullname
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    const parts = cleanName.split(/\s+/);
    if (parts.length === 0) return [];

    const firstname = parts[0];
    const emails = [`${firstname}@${domain}`];

    if (parts.length > 1) {
        const lastname = parts.slice(1).join("");
        emails.push(`${firstname}.${lastname}@${domain}`);
        emails.push(`${firstname[0]}${lastname}@${domain}`);
    }

    return emails;
}
