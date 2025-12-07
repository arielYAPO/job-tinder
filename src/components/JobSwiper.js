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

    async function handleReset() {
        setIsResetting(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        // Delete only PASS swipes (not LIKE - those are already applied)
        await supabase.from('swipes').delete().eq('user_id', user.id).eq('action', 'pass');

        // Refresh the page to reload jobs
        window.location.reload();
    }

    if (currentIndex >= jobs.length) {
        return (
            <div className="glass gradient-border rounded-2xl p-8 text-center">
                <p className="text-4xl mb-3">🎉</p>
                <p className="text-xl font-bold text-white">No more jobs!</p>
                <p className="text-[var(--foreground-muted)] mt-2">You've seen all available positions.</p>
                <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="mt-6 px-6 py-3 bg-[var(--primary)] text-black font-semibold rounded-xl hover:glow-primary transition-all disabled:opacity-50 active:scale-[0.98]"
                >
                    {isResetting ? '🔄 Resetting...' : '🔄 See passed jobs again'}
                </button>
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
