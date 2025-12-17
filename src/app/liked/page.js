import createClient from "@/lib/supabase/server";
import CVDownloadButton from "@/components/CVDownloadButton";
import CoverLetterDownloadButton from "@/components/CoverLetterDownloadButton";
import RegenerateButton from "@/components/RegenerateButton";
import { Briefcase, MapPin, Heart, ChevronLeft, ExternalLink, ArrowUpDown } from "lucide-react";
import Link from "next/link";

async function LikedPage({ searchParams }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Get sort param from URL (default: desc = most recent first)
    const sortOrder = (await searchParams)?.sort === 'asc' ? 'asc' : 'desc';

    // Fetch liked jobs with job details (sorted by date)
    const { data: jobLiked } = await supabase
        .from('applications')
        .select('*, jobs(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: sortOrder === 'asc' });

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

    // Create maps for job_id to CV and Cover Letter content
    const cvMap = {};
    const coverLetterMap = {};
    generatedCVs?.forEach(cv => {
        cvMap[cv.job_id] = cv.cv_content;
        coverLetterMap[cv.job_id] = cv.cover_letter;
    });

    if (!jobLiked || jobLiked.length === 0) {
        return (
            <div className="min-h-screen bg-haze">
                <div className="max-w-lg mx-auto px-4 py-8">
                    <div className="flex justify-between items-center mb-8">
                        <h1 className="text-2xl font-bold text-white">
                            Liked <span className="text-neon">Jobs</span>
                        </h1>
                        <a href="/jobs" className="px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-xl hover:glow-primary transition text-sm flex items-center gap-1">
                            <ChevronLeft className="w-4 h-4" /> Retour
                        </a>
                    </div>
                    <div className="glass gradient-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <div className="p-4 bg-white/5 rounded-full mb-4">
                            <Briefcase className="w-8 h-8 text-[var(--foreground-dim)]" />
                        </div>
                        <p className="text-xl font-bold text-white">Aucun job liké !</p>
                        <p className="text-[var(--foreground-muted)] mt-2 text-sm">Swipe des jobs pour les voir ici.</p>
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
                    <a href="/jobs" className="px-4 py-2 bg-[var(--primary)] text-black font-medium rounded-xl hover:glow-primary transition text-sm flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" /> Back
                    </a>
                </div>

                {/* Sort & Count Row */}
                <div className="flex items-center justify-between mb-6">
                    <p className="text-sm text-[var(--foreground-dim)] tracking-wide">
                        {jobLiked.length} candidature{jobLiked.length > 1 ? 's' : ''}
                    </p>

                    {/* Sort Dropdown */}
                    <div className="flex items-center gap-2">
                        <ArrowUpDown className="w-3.5 h-3.5 text-[var(--foreground-dim)]" />
                        <Link
                            href={`/liked?sort=${sortOrder === 'desc' ? 'asc' : 'desc'}`}
                            className="text-xs text-[var(--foreground-muted)] hover:text-white transition px-2 py-1 bg-white/5 rounded-lg border border-white/10"
                        >
                            {sortOrder === 'desc' ? '📅 Plus récent' : '📅 Plus ancien'}
                        </Link>
                    </div>
                </div>

                <div className="space-y-4">
                    {jobLiked.map(app => (
                        <div key={app.id} className="glass rounded-xl p-6 border border-white/5 hover:border-[var(--primary)]/30 transition-all">
                            <h2 className="text-lg font-bold text-white mb-1">{app.jobs.title}</h2>
                            <p className="text-[var(--primary)] font-medium text-sm mb-3">{app.jobs.company_name}</p>

                            <div className="flex items-center gap-2 text-[var(--foreground-dim)] text-xs mb-4">
                                <MapPin className="w-3.5 h-3.5" />
                                {app.jobs.location_city}

                                {/* Apply Link - use apply_link or job_url for LinkedIn */}
                                <a
                                    href={app.jobs.apply_url || app.jobs.apply_link || app.jobs.job_url || `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(app.jobs.title)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-auto flex items-center gap-1 px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-medium hover:bg-[var(--primary)]/20 transition-colors border border-[var(--primary)]/20"
                                >
                                    <ExternalLink className="w-3 h-3" />
                                    Postuler
                                </a>
                            </div>

                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--secondary)]/10 text-[var(--secondary)] rounded-full text-xs font-medium tracking-wide border border-[var(--secondary)]/20">
                                    <Heart className="w-3 h-3 fill-current" /> Candidature
                                </span>

                                <div className="flex items-center gap-2">
                                    {cvMap[app.job_id] ? (
                                        <>
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
                                            {coverLetterMap[app.job_id] && (
                                                <CoverLetterDownloadButton
                                                    coverLetterContent={coverLetterMap[app.job_id]}
                                                    jobTitle={app.jobs.title}
                                                    profile={profile}
                                                    job={app.jobs}
                                                />
                                            )}
                                            <RegenerateButton userId={user.id} jobId={app.job_id} />
                                        </>
                                    ) : (
                                        <span className="text-xs text-[var(--foreground-dim)] italic">
                                            Génération...
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default LikedPage;