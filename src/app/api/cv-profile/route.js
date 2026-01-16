import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

/**
 * GET /api/cv-profile - Fetch current user's CV profile
 * Requires user_id as query param since we're using anon client
 */
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');

        if (!userId) {
            return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 });
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

/**
 * POST /api/cv-profile - Update CV profile data
 * Body: { user_id, headline?, experiences?, education?, projects?, bio?, full_name?, ... }
 */
export async function POST(request) {
    try {
        const body = await request.json();
        const { user_id, ...updates } = body;

        if (!user_id) {
            return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 });
        }

        // Allowed fields for CV Builder
        const allowedFields = [
            'full_name', 'email', 'phone', 'linkedin_url', 'github_url', 'portfolio_url',
            'location', 'headline', 'bio', 'experiences', 'education', 'projects',
            'skills', 'languages'
        ];

        // Filter to only allowed fields
        const filteredUpdates = {};
        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        }

        filteredUpdates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('profiles')
            .update(filteredUpdates)
            .eq('user_id', user_id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, profile: data });
    } catch (err) {
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}
