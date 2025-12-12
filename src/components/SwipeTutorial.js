'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, ArrowLeft, ArrowRight, X } from 'lucide-react';

export default function SwipeTutorial() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has seen tutorial
        const hasSeen = localStorage.getItem('has_seen_tutorial');
        if (!hasSeen) {
            // Small delay to let the page load first
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        localStorage.setItem('has_seen_tutorial', 'true');
        setIsVisible(false);
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleDismiss}
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm cursor-pointer md:hidden"
                >
                    <div className="relative w-full max-w-md px-8 text-center pointer-events-none">

                        {/* Hand Animation */}
                        <div className="relative h-32 mb-8 flex justify-center">
                            <motion.div
                                animate={{
                                    x: [-40, 40, -40],
                                    rotate: [-10, 10, -10]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Hand className="w-16 h-16 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />
                            </motion.div>
                        </div>

                        {/* Instructions */}
                        <div className="flex justify-between items-center gap-8">
                            {/* Left / Pass */}
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-full">
                                    <ArrowLeft className="w-8 h-8 text-red-500" />
                                </div>
                                <span className="text-xl font-bold text-red-400">PASS</span>
                            </motion.div>

                            {/* Right / Like */}
                            <motion.div
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="flex flex-col items-center gap-2"
                            >
                                <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-full">
                                    <ArrowRight className="w-8 h-8 text-green-500" />
                                </div>
                                <span className="text-xl font-bold text-green-400">LIKE</span>
                            </motion.div>
                        </div>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-12 text-white/50 text-sm"
                        >
                            Tap anywhere to start
                        </motion.p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
