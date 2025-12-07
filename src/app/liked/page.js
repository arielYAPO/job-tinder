import createClient from "@/lib/supabase/server";
import CVDownloadButton from "@/components/CVDownloadButton";

async function LikedPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch liked jobs with job details
    const { data: jobLiked } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .eq('user_id', user.id);

    // Fetch user profile for all contact info
    const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, location, email, phone, linkedin_url, github_url, portfolio_url')
        .eq('user_id', user.id)
        .single();

    // Fetch generated CVs
    const { data: generatedCVs } = await supabase
        .from('generated_cvs')
        .select('*')
        .eq('user_id', user.id);

    // Create a map of job_id to CV content
    const cvMap = {};
    generatedCVs?.forEach(cv => {
        cvMap[cv.job_id] = cv.cv_content;
    });

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
                    {jobLiked.map(app => (
                        <div key={app.id} className="glass rounded-xl p-5">
                            <h2 className="text-lg font-bold text-white">{app.jobs.title}</h2>
                            <p className="text-[var(--primary)]">{app.jobs.company_name}</p>
                            <p className="text-[var(--foreground-dim)] text-sm mt-1">📍 {app.jobs.location_city}</p>

                            <div className="flex items-center gap-3 mt-3">
                                <span className="px-3 py-1 bg-[var(--secondary)]/20 text-[var(--secondary)] rounded-full text-xs tracking-wide">
                                    ❤️ Applied
                                </span>

                                {cvMap[app.job_id] ? (
                                    <CVDownloadButton
                                        cvContent={cvMap[app.job_id]}
                                        jobTitle={app.jobs.title}
                                        profileName={profile?.full_name}
                                        location={profile?.location}
                                        email={profile?.email}
                                        phone={profile?.phone}
                                        linkedin={profile?.linkedin_url}
                                        github={profile?.github_url}
                                        portfolio={profile?.portfolio_url}
                                    />
                                ) : (
                                    <span className="text-xs text-[var(--foreground-dim)]">
                                        No CV generated
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LikedPage;