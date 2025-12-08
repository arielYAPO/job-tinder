import createClient from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import JobSwiper from "@/components/JobSwiper";
import { User, Heart } from "lucide-react";

async function JobsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ==========================================
    // STEP 1: Fetch from all sources
    // ==========================================

    // 1A. Database jobs (manual)
    const { data: dbJobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('source', 'manual');

    // 1B. API jobs (La Bonne Alternance)
    let apiJobs = [];
    try {
        const res = await fetch('http://localhost:3000/api/labonnealternance', {
            cache: 'no-store'
        });
        if (res.ok) {
            apiJobs = await res.json();
        }
    } catch (err) {
        console.error('API fetch failed:', err);
    }

    // Combine all sources
    const allJobs = [...(dbJobs || []), ...(Array.isArray(apiJobs) ? apiJobs : [])];

    // ==========================================
    // STEP 2: Filter out swiped jobs
    // ==========================================

    const { data: swipes } = await supabase
        .from('swipes')
        .select('source, source_job_id')
        .eq('user_id', user.id);

    // Create Set of "source:id" strings
    const swipedKeys = new Set(
        (swipes || []).map(s => `${s.source}:${s.source_job_id}`)
    );

    // Filter using universal key
    const freshJobs = allJobs.filter(job => {
        const key = `${job.source}:${job.source_job_id}`;
        return !swipedKeys.has(key);
    });

    return (
        <div className="min-h-screen bg-haze">
            <div className="max-w-lg mx-auto px-4 py-8 md:py-8 py-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-8 md:mb-8 mb-4">
                    <h1 className="text-2xl md:text-2xl text-xl font-bold text-white">
                        Job<span className="text-neon">Tinder</span>
                    </h1>
                    <div className="flex gap-2">
                        <a href="/profile" className="px-4 py-2 md:px-4 md:py-2 p-2 bg-white/5 border border-white/10 text-[var(--foreground-muted)] rounded-xl hover:bg-white/10 hover:text-white transition text-sm flex items-center justify-center">
                            <User className="w-5 h-5" />
                        </a>
                        <a href="/liked" className="px-4 py-2 md:px-4 md:py-2 p-2 bg-[var(--secondary)]/20 border border-[var(--secondary)]/30 text-[var(--secondary)] rounded-xl hover:bg-[var(--secondary)]/30 transition text-sm flex items-center justify-center">
                            <Heart className="w-5 h-5 fill-current" />
                        </a>
                        <LogoutButton />
                    </div>
                </div>

                {/* Job Swiper */}
                <JobSwiper jobs={freshJobs} />
            </div>
        </div>
    )
}

export default JobsPage;
