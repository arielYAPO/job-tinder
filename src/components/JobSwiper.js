'use client'
import { useState } from "react";
import JobCard from "./JobCard";
import createClient from "@/lib/supabase/client";

function JobSwiper({ jobs }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isResetting, setIsResetting] = useState(false);

    function handleSwipe() {
        setCurrentIndex(currentIndex + 1);
    }

    // Reset only PASSED jobs (production behavior)
    async function handleResetPassed() {
        setIsResetting(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        await supabase.from('swipes').delete().eq('user_id', user.id).eq('action', 'pass');

        window.location.reload();
    }

    // Reset ALL jobs including likes (for testing)
    async function handleResetAll() {
        setIsResetting(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Delete ALL swipes (both like and pass)
        await supabase.from('swipes').delete().eq('user_id', user.id);

        // Delete all applications
        await supabase.from('applications').delete().eq('user_id', user.id);

        // Delete all generated CVs
        await supabase.from('generated_cvs').delete().eq('user_id', user.id);

        window.location.reload();
    }

    if (currentIndex >= jobs.length) {
        return (
            <div className="glass gradient-border rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-xl font-bold text-white">No more jobs!</p>
                <p className="text-[var(--foreground-muted)] mt-2">You've seen all available positions.</p>

                <div className="flex flex-col gap-3 mt-6">
                    <button
                        onClick={handleResetPassed}
                        disabled={isResetting}
                        className="px-6 py-3 bg-[var(--primary)] text-black font-semibold rounded-xl hover:glow-primary transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                        {isResetting ? '🔄 Resetting...' : '🔄 See passed jobs again'}
                    </button>

                    <button
                        onClick={handleResetAll}
                        disabled={isResetting}
                        className="px-6 py-3 bg-[var(--danger)] text-white font-semibold rounded-xl hover:opacity-80 transition-all disabled:opacity-50 active:scale-[0.98] text-sm"
                    >
                        🧪 Reset ALL (Testing Only)
                    </button>
                </div>
            </div>
        )
    }

    const currentJob = jobs[currentIndex];
    return (
        <div>
            <p className="text-sm text-[var(--foreground-dim)] text-center mb-4 tracking-wide">
                {currentIndex + 1} of {jobs.length} jobs
            </p>
            <JobCard job={currentJob} onSwipe={handleSwipe} />
        </div>
    )
}

export default JobSwiper;
