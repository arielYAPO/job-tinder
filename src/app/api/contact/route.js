
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase Admin client (server-side, with service role key or anon key)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function POST(request) {
    try {
        const { company, job } = await request.json();

        if (!company || !job) {
            return NextResponse.json({ error: "Missing parameters: company and job are required" }, { status: 400 });
        }

        // 0. Récupérer le domaine depuis Supabase (on l'a enrichi avant !)
        let domain = null;
        try {
            const { data, error } = await supabase
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
                message: "Domaine de l'entreprise introuvable dans la base de données"
            });
        }

        // 1. Appeler Serper pour trouver le contact sur LinkedIn
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

        if (data.organic && data.organic.length > 0) {
            const firstTitle = data.organic[0].title;
            // Nettoyage du titre (ex: "Jean Dupont - Dave | LinkedIn" -> "Jean Dupont")
            foundName = firstTitle.split("-")[0].split("|")[0].trim();
        } else {
            return NextResponse.json({
                success: false,
                message: "Aucun contact trouvé sur LinkedIn"
            });
        }

        // 2. Générer l'email (Logique "Blindée")
        const email = generateEmail(foundName, domain);

        return NextResponse.json({
            success: true,
            name: foundName,
            email: email,
            domain: domain,
            confidence: "High"
        });

    } catch (error) {
        console.error("API Contact Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// Fonction utilitaire (l'équivalent de ton code Python)
function generateEmail(fullname, domain) {
    // 1. Nettoyage radical (Accents + Minuscules)
    const cleanName = fullname
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();

    // 2. Découpage intelligent
    const parts = cleanName.split(/\s+/);

    if (parts.length === 0) return "";

    const firstname = parts[0];

    // 3. Gestion du Nom de Famille
    if (parts.length > 1) {
        const lastname = parts.slice(1).join("");
        return `${firstname}.${lastname}@${domain}`;
    } else {
        return `${firstname}@${domain}`;
    }
}
