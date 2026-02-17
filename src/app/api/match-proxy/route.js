import { NextResponse } from 'next/server';
import createClient from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const supabase = await createClient();

        // 1. AUTHENTICATE
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
        }

        // 2. RATE LIMIT (3 searches/day)
        const { allowed, remaining } = await checkRateLimit(supabase, user.id, 'searches', 3);
        if (!allowed) {
            return NextResponse.json({
                success: false,
                rateLimited: true,
                remaining: 0,
                message: "💎 Limite atteinte : vous avez utilisé vos 3 analyses IA pour aujourd'hui. Revenez demain !"
            });
        }

        // 3. FORWARD TO PYTHON BACKEND
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

        // Add remaining credits to response
        data.remaining = remaining;

        return NextResponse.json(data);

    } catch (error) {
        console.error("Match Proxy Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
