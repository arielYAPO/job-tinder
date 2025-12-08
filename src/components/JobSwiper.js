'use client'
import { useState, useCallback } from "react";
import JobCard from "./JobCard";
import createClient from "@/lib/supabase/client";
import { PartyPopper, RefreshCcw, FlaskConical, Heart, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function JobSwiper({ jobs }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [exitX, setExitX] = useState(0);
    const [cards, setCards] = useState(jobs);

    const handleSwipe = useCallback((dir) => {
        // Set exit direction
        setExitX(dir === 'left' ? -300 : 300);

        // After a short delay, move to next card
        setTimeout(() => {
            setCurrentIndex(prev => prev + 1);
            setExitX(0);
        }, 250);
    }, []);

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

        await supabase.from('swipes').delete().eq('user_id', user.id);
        await supabase.from('applications').delete().eq('user_id', user.id);
        await supabase.from('generated_cvs').delete().eq('user_id', user.id);

        window.location.reload();
    }

    if (currentIndex >= jobs.length) {
        return (
            <div className="glass gradient-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-white/5 rounded-full mb-6">
                    <PartyPopper className="w-12 h-12 text-[var(--primary)]" />
                </div>
                <p className="text-xl font-bold text-white">No more jobs!</p>
                <p className="text-[var(--foreground-muted)] mt-2">You've seen all available positions.</p>

                <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
                    <button
                        onClick={handleResetPassed}
                        disabled={isResetting}
                        className="px-6 py-3 bg-[var(--primary)] text-black font-semibold rounded-xl hover:glow-primary transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                        <RefreshCcw className={`w-4 h-4 ${isResetting ? 'animate-spin' : ''}`} />
                        {isResetting ? 'Resetting...' : 'See passed jobs again'}
                    </button>

                    <button
                        onClick={handleResetAll}
                        disabled={isResetting}
                        className="px-6 py-3 bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] font-semibold rounded-xl hover:bg-[var(--danger)]/20 transition-all disabled:opacity-50 active:scale-[0.98] text-sm flex items-center justify-center gap-2"
                    >
                        <FlaskConical className="w-4 h-4" />
                        Reset ALL (Testing Only)
                    </button>
                </div>
            </div>
        )
    }

    const currentJob = jobs[currentIndex];

    return (
        <div className="relative h-full w-full">
            <p className="text-sm text-[var(--foreground-dim)] text-center mb-4 tracking-wide">
                {currentIndex + 1} of {jobs.length} jobs
            </p>

            <AnimatePresence mode="wait">
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        x: exitX,
                        rotate: exitX !== 0 ? exitX / 20 : 0
                    }}
                    exit={{
                        opacity: 0,
                        scale: 0.9,
                        transition: { duration: 0.2 }
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                    }}
                    className="h-full w-full"
                >
                    {/* Show overlay when swiping */}
                    {exitX !== 0 && (
                        <div className={`absolute inset-0 rounded-3xl z-10 flex items-center justify-center pointer-events-none ${exitX < 0 ? 'bg-red-500/30' : 'bg-green-500/30'}`}>
                            <div className={`p-4 rounded-full ${exitX < 0 ? 'bg-red-500' : 'bg-green-500'}`}>
                                {exitX < 0 ? (
                                    <X className="w-10 h-10 text-white" />
                                ) : (
                                    <Heart className="w-10 h-10 text-white fill-white" />
                                )}
                            </div>
                        </div>
                    )}

                    <JobCard job={currentJob} onSwipe={handleSwipe} />
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default JobSwiper;
