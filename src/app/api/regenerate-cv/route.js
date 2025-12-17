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
        const { user_id, job_id, promptVersion = 'v2' } = await request.json();

        // 1. Delete existing CV for this job
        const { error: deleteError } = await supabase
            .from('generated_cvs')
            .delete()
            .eq('user_id', user_id)
            .eq('job_id', job_id);

        if (deleteError) {
            console.log('Delete error (may not exist):', deleteError);
        }

        // 2. Call the generate-cv endpoint internally (reuse logic)
        const generateResponse = await fetch(new URL('/api/generate-cv', request.url), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id, job_id, promptVersion })
        });

        const result = await generateResponse.json();

        if (!result.success) {
            return Response.json({
                success: false,
                error: result.error || 'Failed to regenerate CV'
            }, { status: 500 });
        }

        return Response.json({
            success: true,
            message: 'CV regenerated successfully',
            cv: result.cv,
            cover_letter: result.cover_letter
        });

    } catch (error) {
        console.error('Error regenerating CV:', error);
        return Response.json({
            success: false,
            error: error.message || 'Unknown error'
        }, { status: 500 });
    }
}
