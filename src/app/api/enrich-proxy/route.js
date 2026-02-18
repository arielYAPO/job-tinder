import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Proxy for Gemini enrichment — THIS is the expensive call.
 * Rate limited to 3/day (each call = Gemini tokens).
 * Now accepts POST with company_names from matching results.
 */
export async function POST(request) {
    try {
        const supabase = await createClient();

        // 1. AUTHENTICATE
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 2. RATE LIMIT (3 enrichments/day — this is where Gemini tokens are spent)
        const { allowed, remaining } = await checkRateLimit(supabase, user.id, 'searches', 3);
        if (!allowed) {
            return NextResponse.json({
                success: false,
                rateLimited: true,
                remaining: 0,
                message: "💎 Limite atteinte : vous avez utilisé vos 3 analyses IA pour aujourd'hui. Revenez demain !"
            });
        }

        // 3. PARSE BODY (company_names from matching results)
        const body = await request.json().catch(() => ({}));
        const companyNames = body.company_names || [];
        const limit = body.limit || 10;
        const force = body.force ?? true;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

        // 4. FORWARD TO PYTHON BACKEND (now POST)
        const backendResponse = await fetch(
            `${apiUrl}/enrich/lazy-top50`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    company_names: companyNames,
                    user_id: user.id,
                    limit,
                    force
                })
            }
        );

        if (!backendResponse.ok) {
            console.warn('[Enrich Proxy] Backend error:', backendResponse.status);
            return NextResponse.json({ success: false });
        }

        const data = await backendResponse.json();
        data.remaining = remaining;
        return NextResponse.json(data);

    } catch (error) {
        console.error("Enrich Proxy Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
