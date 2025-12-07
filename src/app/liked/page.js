import createClient from "@/lib/supabase/server";

async function LikedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: jobLiked, error } = await supabase.from('applications').select('*,jobs(*)').eq('user_id', user.id);

    if (!jobLiked || jobLiked.length === 0) {
        return (
            <div className="min-h-screen bg-haze">
                <div className="max-w-lg mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-white">
                            Liked <span className="text-neon">Jobs</span>
                        </h1>
                        <a href="/jobs" className="px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-xl hover:glow-primary transition text-sm">
                            ← Back
                        </a>
                    </div>
                    <div className="glass gradient-border rounded-2xl p-8 text-center">
                        <p className="text-4xl mb-3">💼</p>
                        <p className="text-xl font-bold text-white">No liked jobs yet!</p>
                        <p className="text-[var(--foreground-muted)] mt-2">Go swipe some jobs to see them here.</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-haze">
            <div className="max-w-lg mx-auto px-4 py-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-2xl font-bold text-white">
                        Liked <span className="text-neon">Jobs</span>
                    </h1>
                    <a href="/jobs" className="px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-xl hover:glow-primary transition text-sm">
                        ← Back
                    </a>
                </div>

                <p className="text-sm text-[var(--foreground-dim)] mb-6 tracking-wide">
                    {jobLiked.length} job{jobLiked.length > 1 ? 's' : ''} applied
                </p>

                <div className="space-y-4">
                    {jobLiked.map(job => (
                        <div key={job.id} className="glass rounded-xl p-5 hover:bg-[var(--surface-hover)] transition">
                            <h2 className="text-lg font-bold text-white">{job.jobs.title}</h2>
                            <p className="text-[var(--primary)]">{job.jobs.company_name}</p>
                            <p className="text-[var(--foreground-dim)] text-sm mt-1">📍 {job.jobs.location_city}</p>
                            <span className="inline-block mt-3 px-3 py-1 bg-[var(--secondary)]/20 text-[var(--secondary)] rounded-full text-xs tracking-wide">
                                ❤️ Applied
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LikedPage;