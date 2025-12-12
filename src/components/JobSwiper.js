'use client'
import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import JobCard from "./JobCard";
import createClient from "@/lib/supabase/client";
import { PartyPopper, RefreshCcw, FlaskConical, Heart, X } from "lucide-react";

const SWIPE_CONFIDENCE_THRESHOLD = 10000;
const OFFSCREEN_X = 600;

function swipePower(offset, velocity) {
    return Math.abs(offset) * velocity;
}

// Individual swipeable card
function SwipeableCard({ job, onSwiped, onSwipe }) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 0, 200], [-12, 0, 12]);
    const opacity = useTransform(x, [-300, 0, 300], [0.75, 1, 0.75]);

    // Overlay opacities based on drag position
    const likeOpacity = useTransform(x, [0, 100], [0, 1]);
    const passOpacity = useTransform(x, [-100, 0], [1, 0]);

    return (
        <motion.div
            className="absolute inset-0 select-none"
            style={{
                x,
                rotate,
                opacity,
                touchAction: "pan-y",
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            dragDirectionLock
            whileTap={{ cursor: "grabbing" }}
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onDragEnd={(_, info) => {
                const offsetX = info.offset.x;
                const velocityX = info.velocity.x;
                const confidence = swipePower(offsetX, velocityX);

                if (confidence > SWIPE_CONFIDENCE_THRESHOLD) {
                    onSwiped(1); // right
                } else if (confidence < -SWIPE_CONFIDENCE_THRESHOLD) {
                    onSwiped(-1); // left
                } else {
                    // snap back
                    x.set(0);
                }
            }}
        >
            {/* Like Overlay */}
            <motion.div
                style={{ opacity: likeOpacity }}
                className="absolute inset-0 rounded-3xl z-10 flex items-center justify-center pointer-events-none bg-green-500/30"
            >
                <div className="p-4 rounded-full bg-green-500">
                    <Heart className="w-10 h-10 text-white fill-white" />
                </div>
            </motion.div>

            {/* Pass Overlay */}
            <motion.div
                style={{ opacity: passOpacity }}
                className="absolute inset-0 rounded-3xl z-10 flex items-center justify-center pointer-events-none bg-red-500/30"
            >
                <div className="p-4 rounded-full bg-red-500">
                    <X className="w-10 h-10 text-white" />
                </div>
            </motion.div>

            <JobCard job={job} onSwipe={onSwipe} />
        </motion.div>
    );
}

function JobSwiper({ jobs }) {
    const [index, setIndex] = React.useState(0);
    const [direction, setDirection] = React.useState(1);
    const [isResetting, setIsResetting] = React.useState(false);

    const current = jobs[index];

    const handleSwiped = React.useCallback((dir) => {
        if (!current) return;
        setDirection(dir);
        setIndex((i) => i + 1);
    }, [current]);

    // For button-triggered swipes from JobCard
    const handleButtonSwipe = React.useCallback((dirStr) => {
        const dir = dirStr === 'right' ? 1 : -1;
        handleSwiped(dir);
    }, [handleSwiped]);

    // Reset only PASSED jobs
    async function handleResetPassed() {
        setIsResetting(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('swipes').delete().eq('user_id', user.id).eq('action', 'pass');
        window.location.reload();
    }

    // Reset ALL jobs (testing)
    async function handleResetAll() {
        setIsResetting(true);
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('swipes').delete().eq('user_id', user.id);
        await supabase.from('applications').delete().eq('user_id', user.id);
        await supabase.from('generated_cvs').delete().eq('user_id', user.id);
        window.location.reload();
    }

    // End state
    if (!current) {
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
        );
    }

    return (
        <div className="relative h-full w-full">
            <p className="text-sm text-[var(--foreground-dim)] text-center mb-4 tracking-wide">
                {index + 1} of {jobs.length} jobs
            </p>

            <div className="relative" style={{ minHeight: '70vh' }}>
                <AnimatePresence custom={direction}>
                    <motion.div
                        key={current.source_job_id || index}
                        custom={direction}
                        exit={(dir) => ({
                            x: dir === 1 ? OFFSCREEN_X : -OFFSCREEN_X,
                            rotate: dir === 1 ? 18 : -18,
                            opacity: 0,
                            transition: { duration: 0.25 },
                        })}
                        className="absolute inset-0"
                    >
                        <SwipeableCard
                            job={current}
                            onSwiped={handleSwiped}
                            onSwipe={handleButtonSwipe}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default JobSwiper;
