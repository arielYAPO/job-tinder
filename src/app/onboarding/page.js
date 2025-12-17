import { redirect } from "next/navigation";
import createClient from "@/lib/supabase/server";
import GuidedOnboarding from "@/components/onboarding/GuidedOnboarding";
import { OnboardingProvider } from "@/context/OnboardingContext";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Check auth
    if (!user) {
        redirect('/login');
    }

    // Fetch profile data
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

    // If onboarding is complete (step >= 5), redirect to jobs
    if (profile?.onboarding_step >= 5) {
        redirect('/jobs');
    }

    // Fetch related data for profile step
    const { data: experiences } = await supabase
        .from('experiences')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false });

    const { data: education } = await supabase
        .from('education')
        .select('*')
        .eq('user_id', user.id)
        .order('graduation_year', { ascending: false });

    const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const initialData = {
        onboarding_step: profile?.onboarding_step ?? 0,
        goal_type: profile?.goal_type || null,
        job_preferences: profile?.job_preferences || {},
        has_liked_job: profile?.has_liked_job || false,
        has_generated_cv: profile?.has_generated_cv || false,
    };

    return (
        <OnboardingProvider initialData={initialData}>
            <GuidedOnboarding
                profile={profile}
                experiences={experiences || []}
                education={education || []}
                projects={projects || []}
            />
        </OnboardingProvider>
    );
}
