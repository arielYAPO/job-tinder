import createClient from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import JobSwiper from "@/components/JobSwiper";

async function JobsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: swipes } = await supabase.from('swipes').select('job_id').eq('user_id', user.id);
    const swipedIds = swipes ? swipes.map((s) => s.job_id) : [];

    let query = supabase.from('jobs').select('*');
    if (swipedIds.length > 0) {
        query = query.not('id', 'in', `(${swipedIds.join(',')})`);
    }

    const { data, error } = await query;
    if (error) {
        return <p className="text-[var(--danger)]">Error loading jobs</p>;
    }

    return (
        <div className="min-h-screen bg-haze">
            <div className="max-w-lg mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        Job<span className="text-neon">Tinder</span>
                    </h1>
                    <div className="flex gap-2">
                        <a href="/profile" className="px-4 py-2 bg-white/5 border border-white/10 text-[var(--foreground-muted)] rounded-xl hover:bg-white/10 transition text-sm">
                            👤
                        </a>
                        <a href="/liked" className="px-4 py-2 bg-[var(--secondary)]/20 border border-[var(--secondary)]/30 text-[var(--secondary)] rounded-xl hover:bg-[var(--secondary)]/30 transition text-sm">
                            ❤️
                        </a>
                        <LogoutButton />
                    </div>
                </div>

                {/* Job Swiper */}
                <JobSwiper jobs={data} />
            </div>
        </div>
    )
}

export default JobsPage;