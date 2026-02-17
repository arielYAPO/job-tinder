import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy for enrichment. No separate rate limit — it's triggered
 * as part of the "search" flow so the match-proxy limit covers it.
 * But we still require auth to prevent abuse.
 */
export async function GET(request) {
    try {
        const supabase = await createClient();

        // 1. AUTHENTICATE
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 2. FORWARD TO PYTHON BACKEND
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get('limit') || '20';
        const force = searchParams.get('force') || 'true';

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

        const backendResponse = await fetch(
            `${apiUrl}/enrich/lazy-top50?limit=${limit}&force=${force}&user_id=${user.id}`,
            {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            }
        );

        if (!backendResponse.ok) {
            console.warn('[Enrich Proxy] Backend error:', backendResponse.status);
            return NextResponse.json({ success: false });
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Enrich Proxy Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
