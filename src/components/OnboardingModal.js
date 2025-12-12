'use client'
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Sparkles, ArrowRight, X, CheckCircle2, Circle } from 'lucide-react';
import Link from 'next/link';

export default function OnboardingModal({ profileStrength, missingItems, onDismiss }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has dismissed before
        const dismissed = localStorage.getItem('onboarding_dismissed');
        if (!dismissed && profileStrength < 70) {
            setIsVisible(true);
        }
    }, [profileStrength]);

    const handleDismiss = () => {
        localStorage.setItem('onboarding_dismissed', 'true');
        setIsVisible(false);
        if (onDismiss) onDismiss();
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="glass gradient-border rounded-3xl p-8 max-w-md w-full relative overflow-hidden"
                >
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--primary)]/10 via-transparent to-[var(--secondary)]/10 pointer-events-none" />

                    {/* Close button */}
                    <button
                        onClick={handleDismiss}
                        className="absolute top-4 right-4 p-2 text-[var(--foreground-dim)] hover:text-white hover:bg-white/10 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="relative z-10">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-gradient-to-br from-[var(--primary)] to-[var(--secondary)] rounded-2xl">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Welcome!</h2>
                                <p className="text-[var(--foreground-muted)] text-sm">Let's set up your profile</p>
                            </div>
                        </div>

                        {/* Message */}
                        <p className="text-[var(--foreground-muted)] mb-6 leading-relaxed">
                            Complete your profile to get <span className="text-[var(--primary)] font-semibold">AI-tailored CVs</span> that match each job perfectly.
                        </p>

                        {/* Progress Bar */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm text-[var(--foreground-dim)]">Profile Strength</span>
                                <span className="text-sm font-bold text-[var(--primary)]">{profileStrength}%</span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${profileStrength}%` }}
                                    transition={{ duration: 1, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full"
                                />
                            </div>
                        </div>

                        {/* Missing Items */}
                        {missingItems.length > 0 && (
                            <div className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <p className="text-xs font-semibold text-[var(--foreground-dim)] uppercase tracking-wider mb-3">Missing:</p>
                                <ul className="space-y-2">
                                    {missingItems.slice(0, 4).map((item, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                                            <Circle className="w-3 h-3 text-[var(--foreground-dim)]" />
                                            {item}
                                        </li>
                                    ))}
                                    {missingItems.length > 4 && (
                                        <li className="text-xs text-[var(--foreground-dim)]">
                                            +{missingItems.length - 4} more...
                                        </li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Buttons */}
                        <div className="flex gap-3">
                            <Link
                                href="/profile"
                                className="flex-1 py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] text-white font-bold rounded-2xl hover:glow-primary transition-all flex items-center justify-center gap-2"
                            >
                                <User className="w-5 h-5" />
                                Complete Profile
                            </Link>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="w-full mt-3 py-3 text-[var(--foreground-dim)] text-sm hover:text-white transition"
                        >
                            Skip for now
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
