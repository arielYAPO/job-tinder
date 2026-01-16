'use client'
import * as React from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import CompanyCard from "./CompanyCard";
import { PartyPopper, Heart, X, Building2 } from "lucide-react";

const SWIPE_CONFIDENCE_THRESHOLD = 10000;
const OFFSCREEN_X = 600;

function swipePower(offset, velocity) {
    return Math.abs(offset) * velocity;
}

// Individual swipeable company card
function SwipeableCompanyCard({ company, onSwiped, onSwipe }) {
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

            <CompanyCard company={company} onSwipe={onSwipe} />
        </motion.div>
    );
}

function CompanySwiper({ companies }) {
    const [index, setIndex] = React.useState(0);
    const [direction, setDirection] = React.useState(1);

    const current = companies[index];

    const handleSwiped = React.useCallback((dir) => {
        if (!current) return;
        setDirection(dir);
        setIndex((i) => i + 1);
    }, [current]);

    // For button-triggered swipes from CompanyCard
    const handleButtonSwipe = React.useCallback((dirStr) => {
        const dir = dirStr === 'right' ? 1 : -1;
        handleSwiped(dir);
    }, [handleSwiped]);

    // End state - no more companies
    if (!current) {
        return (
            <div className="glass gradient-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-white/5 rounded-full mb-6">
                    <PartyPopper className="w-12 h-12 text-[var(--primary)]" />
                </div>
                <p className="text-xl font-bold text-white">No more companies!</p>
                <p className="text-[var(--foreground-muted)] mt-2">
                    You've seen all Station F companies.
                </p>
                <p className="text-sm text-[var(--foreground-dim)] mt-4">
                    Visit <a href="/stationf" className="text-[var(--primary)] hover:underline">/stationf</a> to refresh the list.
                </p>
            </div>
        );
    }

    // Empty companies list
    if (companies.length === 0) {
        return (
            <div className="glass gradient-border rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                <div className="p-4 bg-white/5 rounded-full mb-6">
                    <Building2 className="w-12 h-12 text-[var(--foreground-muted)]" />
                </div>
                <p className="text-xl font-bold text-white">No companies yet</p>
                <p className="text-[var(--foreground-muted)] mt-2">
                    Station F companies will appear here.
                </p>
                <p className="text-sm text-[var(--foreground-dim)] mt-4">
                    Make sure the Python API is running.
                </p>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full">
            <p className="text-sm text-[var(--foreground-dim)] text-center mb-4 tracking-wide">
                {index + 1} of {companies.length} companies
            </p>

            <div className="relative h-[85dvh] min-h-[400px]">
                <AnimatePresence custom={direction}>
                    <motion.div
                        key={current.company || index}
                        custom={direction}
                        exit={(dir) => ({
                            x: dir === 1 ? OFFSCREEN_X : -OFFSCREEN_X,
                            rotate: dir === 1 ? 18 : -18,
                            opacity: 0,
                            transition: { duration: 0.25 },
                        })}
                        className="absolute inset-0 flex flex-col"
                    >
                        <SwipeableCompanyCard
                            company={current}
                            onSwiped={handleSwiped}
                            onSwipe={handleButtonSwipe}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}

export default CompanySwiper;
