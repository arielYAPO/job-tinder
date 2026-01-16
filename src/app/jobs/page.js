import Link from "next/link";
import { redirect } from "next/navigation";
import createClient from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import JobsPageClient from "@/components/JobPageClient";
import { User, Heart } from "lucide-react";
import { calculateProfileStrength, getMissingItems } from "@/lib/profileUtils";

async function JobsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // ==========================================
    // STEP 1: Fetch user profile data for onboarding
    // ==========================================
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // Check if onboarding is not complete - redirect to onboarding
    // onboarding_step < 5 means not complete (null/undefined also means not started)
    const onboardingStep = profile?.onboarding_step ?? 0;
    if (onboardingStep < 5) {
        redirect('/onboarding');
    }

    const { data: experiences } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', user.id);

    const { data: education } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', user.id);

    // Calculate profile strength for onboarding
    const profileStrength = calculateProfileStrength(profile, experiences, education);
    const missingItems = getMissingItems(profile, experiences, education);

    // Onboarding checklist data
    const onboardingData = {
        profileComplete: profileStrength >= 80,
        hasLikedJob: profile?.has_liked_job || false,
        hasGeneratedCV: profile?.has_generated_cv || false,
        hasDownloadedCV: profile?.has_downloaded_cv || false,
    };

    // ==========================================
    // STEP 2: Fetch jobs from all sources
    // ==========================================

    // Database jobs (manual + linkedin)
    const { data: dbJobs } = await supabase
        .from('jobs')
        .select('*')
        .in('source', ['manual', 'linkedin']);

    // Fetch Station F jobs from Python API
    let stationFJobs = [];
    try {
        // Fetch from Python API running locally
        const res = await fetch('http://127.0.0.1:8000/scrape/stationf', {
            next: { revalidate: 60 }, // Cache for 60 seconds
            cache: 'no-store'
        });

        if (res.ok) {
            const data = await res.json();
            if (data.success && data.jobs) {
                stationFJobs = data.jobs.map(job => ({
                    source: 'stationf',
                    source_job_id: job.url, // Use partial URL as ID
                    title: job.title,
                    company_name: job.company,
                    contract_type: job.contract,
                    apply_url: job.url.startsWith('http') ? job.url : `https://jobs.stationf.co${job.url}`,
                    description: "Voir la description complète sur Station F",
                    location_city: "Paris (Station F)",
                    remote_mode: null,
                    is_stationf: true // Flag for UI
                }));
            }
        }
    } catch (e) {
        console.warn("Could not fetch Station F jobs (Python API might be offline):", e.message);
    }

    // Merge all jobs
    const allJobs = [...(dbJobs || []), ...stationFJobs];

    // ==========================================
    // STEP 3: Filter out swiped jobs
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
                        <Link href="/profile" className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 text-[var(--foreground-muted)] rounded-xl hover:bg-white/10 hover:text-white transition text-sm font-medium">
                            <User className="w-4 h-4" />
                            <span>Profil</span>
                        </Link>
                        <Link href="/liked" className="flex items-center gap-2 px-4 py-2 bg-[var(--secondary)]/20 border border-[var(--secondary)]/30 text-[var(--secondary)] rounded-xl hover:bg-[var(--secondary)]/30 transition text-sm font-medium">
                            <Heart className="w-4 h-4 fill-current" />
                            <span>Mes CV</span>
                        </Link>
                        <LogoutButton />
                    </div>
                </div>

                <JobsPageClient
                    jobs={freshJobs}
                    profileStrength={profileStrength}
                    missingItems={missingItems}
                    onboardingData={onboardingData}
                />
            </div>
        </div>
    )
}

export default JobsPage;
