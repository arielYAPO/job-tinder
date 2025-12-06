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
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <p className="text-2xl mb-2">🎉</p>
                <p className="text-xl font-semibold text-gray-800">No more jobs!</p>
                <p className="text-gray-600 mt-2">You've seen all available positions.</p>
                <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="mt-6 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold disabled:opacity-50"
                >
                    {isResetting ? '🔄 Resetting...' : '🔄 See passed jobs again'}
                </button>
            </div>
        )
    }

    const currentJob = jobs[currentIndex];
    return (
        <div>
            <p className="text-sm text-gray-500 text-center mb-4">
                {currentIndex + 1} of {jobs.length} jobs
            </p>
            <JobCard job={currentJob} onSwipe={handleSwipe} />
        </div>
    )
}

export default JobSwiper;
