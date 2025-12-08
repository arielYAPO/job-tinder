'use client'
import { useState } from "react";
import JobCard from "./JobCard";
import createClient from "@/lib/supabase/client";
import { PartyPopper, RefreshCcw, FlaskConical, Heart, X } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

function JobSwiper({ jobs }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isResetting, setIsResetting] = useState(false);
    const [direction, setDirection] = useState(null);

    // Track drag position for visual feedback
    const x = useMotionValue(0);

    // Transform drag position to opacity for overlays (0-1)
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const passOpacity = useTransform(x, [-100, 0], [1, 0]);

    // Transform drag position to rotation
    const rotate = useTransform(x, [-200, 0, 200], [-15, 0, 15]);

    function handleSwipe(dir) {
        setDirection(dir);
        setCurrentIndex(currentIndex + 1);
        // Reset the x position for next card
        x.set(0);
    }

    const variants = {
        enter: {
            scale: 0.9,
            y: 30,
            opacity: 0
        },
        center: {
            scale: 1,
            y: 0,
            opacity: 1,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.3
            }
        },
        exit: (custom) => {
            if (custom === 'left') {
                return {
                    x: -500,
                    rotate: -25,
                    opacity: 0,
                    transition: { duration: 0.3 }
                };
            } else {
                return {
                    x: 500,
                    rotate: 25,
                    opacity: 0,
                    transition: { duration: 0.3 }
                };
            }
        }
    };

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
            <AnimatePresence mode="popLayout" custom={direction}>
                <motion.div
                    key={currentJob.source_job_id || currentIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="h-full w-full relative touch-pan-y"
                    style={{ x, rotate }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.5}
                    dragSnapToOrigin
                    onDragEnd={(e, { offset, velocity }) => {
                        // Use 25% of screen width as threshold for mobile
                        const screenWidth = window.innerWidth;
                        const swipeThreshold = Math.min(screenWidth * 0.25, 100);

                        // Also consider velocity for quick flicks
                        const swipeVelocity = 500;

                        if (offset.x < -swipeThreshold || velocity.x < -swipeVelocity) {
                            handleSwipe('left');
                        } else if (offset.x > swipeThreshold || velocity.x > swipeVelocity) {
                            handleSwipe('right');
                        }
                    }}
                >
                    {/* Visual feedback overlays */}
                    <motion.div
                        className="absolute inset-0 bg-green-500/20 rounded-3xl pointer-events-none z-10 flex items-center justify-center"
                        style={{ opacity: likeOpacity }}
                    >
                        <div className="bg-green-500 rounded-full p-4">
                            <Heart className="w-12 h-12 text-white fill-white" />
                        </div>
                    </motion.div>

                    <motion.div
                        className="absolute inset-0 bg-red-500/20 rounded-3xl pointer-events-none z-10 flex items-center justify-center"
                        style={{ opacity: passOpacity }}
                    >
                        <div className="bg-red-500 rounded-full p-4">
                            <X className="w-12 h-12 text-white" />
                        </div>
                    </motion.div>

                    <JobCard job={currentJob} onSwipe={handleSwipe} />
                </motion.div>
            </AnimatePresence>
        </div>
    )
}

export default JobSwiper;
