import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Proxy for matching. Auth-only, NO rate limit.
 * Matching is just scoring (CPU on VPS, fixed cost).
 * This is called on every page load to display results.
 */
export async function POST(request) {
    try {
        const supabase = await createClient();

        // 1. AUTHENTICATE
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 2. FORWARD TO PYTHON BACKEND (no rate limit — matching is free)
        const body = await request.json();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

        const backendResponse = await fetch(`${apiUrl}/match-by-company`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({}));
            throw new Error(errorData.detail || `Backend error: ${backendResponse.status}`);
        }

        const data = await backendResponse.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error("Match Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
